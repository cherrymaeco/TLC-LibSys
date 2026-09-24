(function() {
    // >>>>>>>>>>  STEP: paste your Web App URL between the quotes  <<<<<<<<<<
    // It looks like: https://script.google.com/macros/s/AKfycb.../exec
    const MY_BOOKS_API_URL = 'https://script.google.com/macros/s/AKfycbzt1DfmssyHbDIpMRms_iuiJJ_iMRWIt9LqEb0TIRLHyIBjsqkj_-FHHsNON59LF7s/exec';

    const myBooksMessage = document.getElementById('my_books_message');
    const myBooksWrap = document.getElementById('my_books_table_wrap');
    const myBooksBody = document.getElementById('my_books_body');

    function isConfigured() {
        return MY_BOOKS_API_URL.indexOf('https://script.google.com/') === 0;
    }

    async function saveBorrowRecord(record) {
        if (!isConfigured()) {
            throw new Error('The My Books URL is not set yet (see user/current_book_records.js).');
        }

        const response = await fetch(MY_BOOKS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(record)
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || 'Unknown error.');
        return result;
    }

    async function fetchCurrentBooks() {
        if (!isConfigured()) {
            throw new Error('The My Books URL is not set yet (see user/current_book_records.js).');
        }
        const url = MY_BOOKS_API_URL + '?action=current';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('The My Books service returned HTTP ' + response.status + '.');
        }
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || 'Unknown error.');
        if (!Array.isArray(result.rows)) {
            throw new Error('The My Books service is using an old deployment. Redeploy the Apps Script web app and try again.');
        }
        return result.rows;
    }

    function setMessage(text) {
        myBooksMessage.textContent = text;
    }

    function addCell(row, text, className) {
        const cell = document.createElement('td');
        cell.textContent = text; // textContent, never innerHTML (safe)
        if (className) cell.className = className;
        row.appendChild(cell);
    }

    function renderCurrentBooks(rows) {
        rows = Array.isArray(rows) ? rows : [];
        myBooksBody.replaceChildren();

        if (!rows.length) {
            myBooksWrap.hidden = true;
            setMessage('No books are currently borrowed.');
            return;
        }

        rows.forEach(function(item) {
            const tr = document.createElement('tr');
            addCell(tr, item.title);
            addCell(tr, item.author);
            addCell(tr, item.dueDate);
            addCell(tr, item.borrowDate);
            myBooksBody.appendChild(tr);
        });

        myBooksWrap.hidden = false;
        setMessage(rows.length + (rows.length === 1 ? ' record found.' : ' records found.'));
    }

    async function showMyBooks() {
        if (!myBooksMessage || !myBooksWrap || !myBooksBody) return;
        myBooksWrap.hidden = true;
        setMessage('Loading...');
        try {
            renderCurrentBooks(await fetchCurrentBooks());
        } catch (err) {
            setMessage('Could not load My Books: ' + err.message);
        }
    }

    showMyBooks();

    // Used by book_borrow_modal.js
    window.TLCMyBooks = {
        saveBorrowRecord: saveBorrowRecord,
        showMyBooks: showMyBooks
    };
})();