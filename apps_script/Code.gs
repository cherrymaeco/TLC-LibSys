const SHEET_NAME = 'Current Books';
const HEADERS = [
  'Timestamp', 'Borrower', 'Borrower Email', 'ISBN', 'Title', 'Author',
  'Borrow Date', 'Due Date', 'Status'
];

const ADMIN_EMAIL = '';

// Friendly display name + reply-to for outgoing mail.
const LIBRARY_NAME  = 'TLC Library';
const LIBRARY_REPLY = 'cherrymaeco@thelewiscollege.edu.ph';

function setup() {
  getSheet_();
  Logger.log('Ready. The "' + SHEET_NAME + '" tab exists.');
}

function testEmails() {
  const me = Session.getEffectiveUser().getEmail();
  Logger.log('Effective user (sender): ' + me);

  try {
    GmailApp.sendEmail(me, 'TLC LibSys test (self)', 'If you got this, GmailApp.sendEmail works.', {
      name: LIBRARY_NAME,
      replyTo: LIBRARY_REPLY
    });
    Logger.log('OK: self email sent to ' + me);
  } catch (err) {
    Logger.log('FAIL self: ' + errorMessage_(err));
    Logger.log(err && err.stack ? err.stack : '');
  }

  if (ADMIN_EMAIL) {
    try {
      GmailApp.sendEmail(ADMIN_EMAIL, 'TLC LibSys test (admin)', 'If you got this, admin delivery works.', {
        name: LIBRARY_NAME,
        replyTo: LIBRARY_REPLY
      });
      Logger.log('OK: admin email sent to ' + ADMIN_EMAIL);
    } catch (err) {
      Logger.log('FAIL admin: ' + errorMessage_(err));
      Logger.log(err && err.stack ? err.stack : '');
    }
  }

  const remaining = MailApp.getRemainingDailyQuota();
  Logger.log('Remaining daily email quota: ' + remaining);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const raw = (e && e.postData && e.postData.contents) || '{}';
    const body = JSON.parse(raw);

    const sheet = getSheet_();
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    const now = new Date();

    const borrower = clean_(body.borrowerName, 100);
    const email    = clean_(body.email, 200);
    const ISBN   = clean_(body.ISBN, 30);
    const title    = clean_(body.title, 200);
    const author   = clean_(body.author, 200);
    const dueDate  = String(body.dueDate || '').trim();
    const today    = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    const borrowDateDisplay = Utilities.formatDate(now, tz, 'MMMM d, yyyy');

    if (!borrower) throw new Error('Borrower name is required.');
    if (!title)    throw new Error('Book title is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('Due date must look like 2026-09-30.');
    if (dueDate < today) throw new Error('Due date cannot be in the past.');
    const dueDateDisplay = fmtDay_(dueDate, tz);

    const columns = getHeaderMap_(sheet);
    const rowNumber = sheet.getLastRow() + 1;
    const row = [];
    row[columns.timestamp - 1] = now;
    row[columns.borrower - 1] = borrower;
    row[columns.borrowerEmail - 1] = email;
    row[columns.ISBN - 1] = ISBN;
    row[columns.title - 1] = title;
    row[columns.author - 1] = author;
    row[columns.borrowDate - 1] = borrowDateDisplay;
    row[columns.dueDate - 1] = dueDateDisplay;
    row[columns.status - 1] = 'Borrowed';
    sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn())
         .setValues([fillRow_(row, sheet.getLastColumn())]);

    const emailWarnings = sendBorrowEmails_(borrower, email, title, author, dueDateDisplay);

    return json_({ ok: true, emailWarnings: emailWarnings });
  } catch (err) {
    Logger.log('doPost failed: ' + errorMessage_(err));
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};

    if (p.action === 'current') {
      return json_({ ok: true, rows: readHistoryRows_(function (r) {
        return String(r.status || 'Borrowed').trim().toLowerCase() === 'borrowed';
      }) });
    }

    if (p.action === 'history') {
      const wanted = norm_(p.name);
      if (!wanted) return json_({ ok: false, error: 'Please enter your name.' });

      const rows = readHistoryRows_(function (r) {
        return norm_(r.borrower) === wanted;
      });
      return json_({ ok: true, rows: rows });
    }

    if (p.action === 'emailtest') {
      const me = Session.getEffectiveUser().getEmail();
      const warnings = [];
      try {
        GmailApp.sendEmail(me, 'TLC LibSys deployment email test', 'Delivery from the web app works.', {
          name: LIBRARY_NAME,
          replyTo: LIBRARY_REPLY
        });
      } catch (err) {
        warnings.push(errorMessage_(err));
      }
      return json_({
        ok: warnings.length === 0,
        sender: me,
        adminEmail: ADMIN_EMAIL || '(fallback to sender)',
        remainingQuota: MailApp.getRemainingDailyQuota(),
        warnings: warnings
      });
    }

    return json_({ ok: true, message: 'TLC LibSys history API is running.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ============================ helpers ============================= */

function readHistoryRows_(matches) {
  const sheet = getSheet_();
  const columns = getHeaderMap_(sheet);
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const lastRow = sheet.getLastRow();
  const rows = [];

  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    values.forEach(function (row) {
      const r = {
        timestamp: row[columns.timestamp - 1],
        borrower: row[columns.borrower - 1],
        borrowerEmail: row[columns.borrowerEmail - 1],
        ISBN: row[columns.ISBN - 1],
        title: row[columns.title - 1],
        author: row[columns.author - 1],
        borrowDate: row[columns.borrowDate - 1],
        dueDate: row[columns.dueDate - 1],
        status: row[columns.status - 1]
      };
      if (!matches(r)) return;
      rows.push({
        timestamp:  fmtStamp_(r.timestamp, tz),
        borrower:   String(r.borrower),
        ISBN:     String(r.ISBN),
        title:      String(r.title),
        author:     String(r.author),
        borrowDate: fmtDay_(r.borrowDate, tz),
        dueDate:    fmtDay_(r.dueDate, tz),
        status:     String(r.status || 'Borrowed')
      });
    });
    rows.reverse();
  }
  return rows;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const existing = sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : [];
  const headers = existing.slice();
  HEADERS.forEach(function (header) {
    if (headers.indexOf(header) === -1) headers.push(header);
  });
  if (!headers.length) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  const columns = getHeaderMap_(sheet);
  sheet.getRange(1, columns.borrowDate, sheet.getMaxRows(), 1).setNumberFormat('@');
  sheet.getRange(1, columns.dueDate, sheet.getMaxRows(), 1).setNumberFormat('@');
}

function getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  HEADERS.forEach(function (header) {
    const index = headers.indexOf(header);
    if (index === -1) throw new Error('Missing required spreadsheet header: ' + header);
    map[headerToKey_(header)] = index + 1;
  });
  return map;
}

function headerToKey_(header) {
  if (header === 'ISBN') return 'ISBN';
  return header.replace(/[^a-zA-Z]/g, '').replace(/^./, function (c) { return c.toLowerCase(); });
}

function fillRow_(row, length) {
  while (row.length < length) row.push('');
  return row;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value, maxLen) {
  let s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function norm_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().toLowerCase();
}

function fmtStamp_(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'MMMM d, yyyy h:mm a') : String(v);
}

function fmtDay_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'MMMM d, yyyy');
  const value = String(v == null ? '' : v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Utilities.formatDate(Utilities.parseDate(value, tz, 'yyyy-MM-dd'), tz, 'MMMM d, yyyy');
  }
  return value;
}


//  Sends the student receipt and the admin heads-up.
function sendBorrowEmails_(borrower, email, title, author, dueDate) {
  const warnings = [];

  // ---- 1. Student receipt ----
  try {
    GmailApp.sendEmail(
      email,
      'TLC LibSys - Borrow confirmation: ' + title,
      'Hi ' + borrower + ',\n\n' +
      'This confirms you borrowed the following book:\n\n' +
      'Title: ' + title + '\n' +
      'Author: ' + author + '\n' +
      'Due date: ' + dueDate + '\n\n' +
      'Please return it by the due date. Thank you for using TLC LibSys.',
      { name: LIBRARY_NAME, replyTo: LIBRARY_REPLY }
    );
    Logger.log('Student email sent to ' + email);
  } catch (err) {
    const message = 'Student email failed: ' + errorMessage_(err);
    Logger.log(message);
    Logger.log(err && err.stack ? err.stack : '');
    warnings.push(message);
  }

  // ---- 2. Admin heads-up ----
  const adminEmail = ADMIN_EMAIL || Session.getEffectiveUser().getEmail();
  if (!adminEmail) {
    const message = 'Admin email was not resolved. Set ADMIN_EMAIL or deploy the web app to execute as the owner.';
    Logger.log(message);
    warnings.push(message);
  } else {
    try {
      GmailApp.sendEmail(
        adminEmail,
        'TLC LibSys - New borrow: ' + title,
        borrower + ' (' + email + ') borrowed "' + title + '" by ' + author + '.\n' +
        'Due date: ' + dueDate,
        { name: LIBRARY_NAME, replyTo: LIBRARY_REPLY }
      );
      Logger.log('Admin email sent to ' + adminEmail);
    } catch (err) {
      const message = 'Admin email failed: ' + errorMessage_(err);
      Logger.log(message);
      Logger.log(err && err.stack ? err.stack : '');
      warnings.push(message);
    }
  }

  return warnings;
}

function errorMessage_(err) {
  if (!err) return 'Unknown error';
  const name = err.name ? err.name + ': ' : '';
  return name + String(err.message || err);
}