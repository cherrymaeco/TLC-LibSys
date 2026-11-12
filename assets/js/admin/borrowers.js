// Admin actions: Mark Picked Up, Mark Returned, Cancel reservation.
const LOANS_API_URL = 'borrowers_api.php';   // admin/borrowers_api.php

const loansTableBody   = document.getElementById('loans_table_body');
const loanSearchInput  = document.getElementById('loan_search');
const loanFilterSelect = document.getElementById('loan_filter');

let allLoans = [];

async function callLoansApi(method, bodyObject) {
    const requestOptions = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (bodyObject) requestOptions.body = JSON.stringify(bodyObject);

    const response = await fetch(LOANS_API_URL, requestOptions);
    const result = await response.json();
    if (!result.ok) {
        throw new Error((result.errors || ['Unknown error.']).join('\n'));
    }
    return result;
}

async function loadLoans() {
    showMessageRow('Loading...');
    try {
        allLoans = (await callLoansApi('GET')).loans;
        renderLoans();
    } catch (error) {
        showMessageRow('Could not load loans: ' + error.message);
    }
}

// "2026-11-08" or "2026-11-08 10:37:02" -> "Nov 8, 2026"
function formatDate(dateText) {
    if (!dateText) return '—';
    const [year, month, day] = dateText.split(' ')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function showMessageRow(text) {
    const messageRow = document.createElement('tr');
    const messageCell = document.createElement('td');
    messageCell.colSpan = 8;
    messageCell.className = 'message_cell';
    messageCell.textContent = text;
    messageRow.appendChild(messageCell);
    loansTableBody.replaceChildren(messageRow);
}

function addCell(rowElement, text, className) {
    const cell = document.createElement('td');
    cell.textContent = text || '—';  
    if (className) cell.className = className;
    rowElement.appendChild(cell);
    return cell;
}

function createActionButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row_btn ' + className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

const FINISHED_STATUSES = ['Returned', 'Cancelled', 'Expired', 'Lost'];

function getVisibleLoans() {
    const searchText = loanSearchInput.value.trim().toLowerCase();
    const filterChoice = loanFilterSelect.value;

    return allLoans.filter((loan) => {
        const isFinished = FINISHED_STATUSES.includes(loan.loan_status);
        const matchesFilter =
            filterChoice === 'all' ||
            (filterChoice === 'current'  && !isFinished) ||
            (filterChoice === 'pickup'   && loan.loan_status === 'Reserved') ||
            (filterChoice === 'overdue'  && loan.loan_status === 'Overdue') ||
            (filterChoice === 'finished' && isFinished);

        const searchableText = [loan.borrower_name, loan.borrower_email, loan.book_title, loan.isbn]
            .join(' ').toLowerCase();
        return matchesFilter && searchableText.includes(searchText);
    });
}

function renderLoans() {
    const visibleLoans = getVisibleLoans();
    if (!visibleLoans.length) {
        showMessageRow('No loans found.');
        return;
    }
    loansTableBody.replaceChildren();

    visibleLoans.forEach((loan) => {
        const isReserved = loan.loan_status === 'Reserved';
        const rowElement = document.createElement('tr');
        addCell(rowElement, loan.borrower_name);
        addCell(rowElement, loan.borrower_email);
        addCell(rowElement, loan.course ? loan.course + ' ' + loan.year_level : '');

        const bookCell = addCell(rowElement, loan.book_title);
        const authorLine = document.createElement('span');
        authorLine.className = 'book_author_small';
        authorLine.textContent = loan.book_author;
        bookCell.appendChild(authorLine);

        // Reserved books haven't left the library yet, so show the reservation date instead.
        addCell(rowElement, loan.picked_up_at ? formatDate(loan.picked_up_at) : 'Reserved ' + formatDate(loan.reserved_at));
        addCell(rowElement, isReserved ? 'Pick up by ' + formatDate(loan.pickup_deadline) : formatDate(loan.due_date));
        addCell(rowElement, loan.loan_status, 'status_' + loan.loan_status.toLowerCase());

        const actionsCell = document.createElement('td');
        actionsCell.className = 'row_actions';
        if (isReserved) {
            actionsCell.appendChild(createActionButton('Mark Picked Up', 'return_btn', () => changeLoan(loan, 'pickup')));
            actionsCell.appendChild(createActionButton('Cancel', 'delete_btn', () => changeLoan(loan, 'cancel')));
        } else if (loan.loan_status === 'Borrowed' || loan.loan_status === 'Overdue') {
            actionsCell.appendChild(createActionButton('Mark Returned', 'return_btn', () => changeLoan(loan, 'return')));
            actionsCell.appendChild(createActionButton('Mark Lost', 'delete_btn', () => changeLoan(loan, 'lost')));
        } else {
            actionsCell.textContent = formatDate(loan.returned_at);
        }
        rowElement.appendChild(actionsCell);

        loansTableBody.appendChild(rowElement);
    });
}

const CONFIRM_MESSAGES = {
    pickup: (loan) => loan.borrower_name + ' is picking up "' + loan.book_title + '" now? The loan period starts today.',
    lost: (loan) => 'Mark "' + loan.book_title + '" as LOST by ' + loan.borrower_name +
        '? This closes the loan and removes one copy from the library\'s total copies.',
    return: (loan) => 'Mark "' + loan.book_title + '" as returned by ' + loan.borrower_name + '?',
    cancel: (loan) => 'Cancel the reservation of "' + loan.book_title + '" for ' + loan.borrower_name + '?'
};

async function changeLoan(loan, action) {
    if (!confirm(CONFIRM_MESSAGES[action](loan))) return;
    try {
        await callLoansApi('PUT', { loan_id: loan.loan_id, action: action });
        await loadLoans();
    } catch (error) {
        alert(error.message);
    }
}

loanSearchInput.addEventListener('input', renderLoans);
loanFilterSelect.addEventListener('change', renderLoans);
loadLoans();