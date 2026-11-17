// current_book_records.js — My Books page: current books (reserved / borrowed) and waitlist.
(function () {
    const listTitleElement = document.getElementById('list_title');
    const listDescriptionElement = document.getElementById('list_description');
    const messageElement = document.getElementById('my_books_message');
    const tableWrapElement = document.getElementById('my_books_table_wrap');
    const headRowElement = document.getElementById('my_books_head_row');
    const bodyElement = document.getElementById('my_books_body');
    const searchInput = document.getElementById('my_books_search');
    const filterControl = document.getElementById('my_books_filter_control');
    const filterSelect = document.getElementById('my_books_filter');
    const sidebarItems = document.querySelectorAll('.sidebar_item[data-list]');

    const LIST_SETTINGS = {
        current: {
            title: 'Current Books',
            description: 'Books you have reserved or borrowed. Reserved books are waiting for you at the school library.',
            columns: ['Title', 'Author', 'Status', 'Pick Up By / Due Date', 'Borrowed On', 'Action'],
            emptyText: 'You have no reserved or borrowed books.'
        },
        waitlist: {
            title: 'Waitlist',
            description: 'When a copy is returned, the first student in line gets it reserved automatically.',
            columns: ['Title', 'Author', 'Joined On', 'Place in Line', 'Action'],
            emptyText: 'You are not on any waitlist.'
        },
        history: {
            title: 'History',
            description: 'Books you have borrowed in the past, newest first.',
            columns: ['Title', 'Author', 'Borrowed On', 'Due Date', 'Closed On', 'Outcome'],
            emptyText: 'Nothing here yet. Books you return will show up in your history.'
        }
    };

    let activeList = 'current';
    let myLoans = [];
    let myWaitlist = [];
    let myHistory = [];

    async function loadMyBooks() {
        messageElement.textContent = 'Loading...';
        tableWrapElement.hidden = true;
        try {
            const result = await TLCLibrary.callLibraryApi('GET', { action: 'my_books' });
            myLoans = result.loans;
            myWaitlist = result.waitlist;
            myHistory = result.history || [];
            render();
        } catch (error) {
            messageElement.textContent = error.httpStatus === 401
                ? 'Please sign in to see your books.'
                : 'Could not load My Books: ' + error.message;
        }
    }

    function addCell(rowElement, text, className) {
        const cellElement = document.createElement('td');
        cellElement.textContent = text;   // textContent, never innerHTML (safe)
        if (className) cellElement.className = className;
        rowElement.appendChild(cellElement);
        return cellElement;
    }

    function addActionButton(rowElement, label, onClick) {
        const cellElement = document.createElement('td');
        const buttonElement = document.createElement('button');
        buttonElement.type = 'button';
        buttonElement.className = 'row_action_btn';
        buttonElement.textContent = label;
        buttonElement.addEventListener('click', onClick);
        cellElement.appendChild(buttonElement);
        rowElement.appendChild(cellElement);
    }

    function getVisibleLoans() {
        const searchText = searchInput.value.trim().toLowerCase();
        return myLoans.filter((loan) => {
            const matchesFilter =
                filterSelect.value === 'all' ||
                (filterSelect.value === 'borrowed' && loan.loan_status === 'Borrowed') ||
                (filterSelect.value === 'overdue' && loan.loan_status === 'Overdue') ||
                (filterSelect.value === 'reserved' && loan.loan_status === 'Reserved');
            return matchesFilter && (loan.title + ' ' + loan.author).toLowerCase().includes(searchText);
        });
    }

    function renderLoanRow(loan) {
        const rowElement = document.createElement('tr');
        addCell(rowElement, loan.title);
        addCell(rowElement, loan.author);
        addCell(rowElement, loan.loan_status, 'status_' + loan.loan_status.toLowerCase());
        const isReserved = loan.loan_status === 'Reserved';
        addCell(rowElement, isReserved
            ? 'Pick up by ' + TLCLibrary.formatDate(loan.pickup_deadline)
            : TLCLibrary.formatDate(loan.due_date));
        addCell(rowElement, isReserved ? '—' : TLCLibrary.formatDate(loan.picked_up_at));
        if (isReserved) {
            addActionButton(rowElement, 'Cancel', () => cancelReservation(loan));
        } else {
            addCell(rowElement, '');
        }
        return rowElement;
    }

    function renderWaitlistRow(entry) {
        const rowElement = document.createElement('tr');
        addCell(rowElement, entry.title);
        addCell(rowElement, entry.author);
        addCell(rowElement, TLCLibrary.formatDate(entry.joined_at));
        addCell(rowElement, '#' + entry.position);
        addActionButton(rowElement, 'Leave', () => leaveWaitlist(entry));
        return rowElement;
    }

    // Turns how a loan ended into the words the student sees.
    function describeOutcome(entry) {
        if (entry.end_reason === 'cancelled') return { text: 'Reservation cancelled', className: 'status_cancelled' };
        if (entry.end_reason === 'expired')   return { text: 'Reservation expired',   className: 'status_expired' };
        if (entry.end_reason === 'lost')      return { text: 'Lost',                  className: 'status_overdue' };
        const returnedLate = entry.returned_at.slice(0, 10) > entry.due_date;
        return returnedLate
            ? { text: 'Returned late', className: 'status_overdue' }
            : { text: 'Returned',      className: 'status_returned' };
    }

    function renderHistoryRow(entry) {
        const rowElement = document.createElement('tr');
        const outcome = describeOutcome(entry);
        addCell(rowElement, entry.title);
        addCell(rowElement, entry.author);
        addCell(rowElement, entry.picked_up_at ? TLCLibrary.formatDate(entry.picked_up_at) : '—');   // never picked up = never borrowed
        addCell(rowElement, entry.picked_up_at ? TLCLibrary.formatDate(entry.due_date) : '—');
        addCell(rowElement, TLCLibrary.formatDate(entry.returned_at));
        addCell(rowElement, outcome.text, outcome.className);
        return rowElement;
    }

    function getRowElements() {
        const searchText = searchInput.value.trim().toLowerCase();
        const matchesSearch = (entry) => (entry.title + ' ' + entry.author).toLowerCase().includes(searchText);
        if (activeList === 'current') return getVisibleLoans().map(renderLoanRow);
        if (activeList === 'history') return myHistory.filter(matchesSearch).map(renderHistoryRow);
        return myWaitlist.filter(matchesSearch).map(renderWaitlistRow);
    }

    function render() {
        const settings = LIST_SETTINGS[activeList];
        listTitleElement.textContent = settings.title;
        listDescriptionElement.textContent = settings.description;
        filterControl.hidden = activeList !== 'current';

        headRowElement.replaceChildren(...settings.columns.map((columnName) => {
            const headerCell = document.createElement('th');
            headerCell.textContent = columnName;
            return headerCell;
        }));

        const rowElements = getRowElements();

        bodyElement.replaceChildren(...rowElements);
        const isCurrentList = activeList === 'current';
        tableWrapElement.hidden = rowElements.length === 0 && !isCurrentList;
        if (isCurrentList && rowElements.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = settings.columns.length;
            emptyCell.textContent = filterSelect.value === 'all'
                ? settings.emptyText
                : 'No books match this filter.';
            emptyRow.appendChild(emptyCell);
            bodyElement.appendChild(emptyRow);
        }
        messageElement.textContent = rowElements.length
            ? rowElements.length + (rowElements.length === 1 ? ' record found.' : ' records found.')
            : isCurrentList && filterSelect.value !== 'all'
                ? 'No books match this filter.'
                : settings.emptyText;
    }

    async function cancelReservation(loan) {
        if (!confirm('Cancel your reservation for "' + loan.title + '"?')) return;
        try {
            await TLCLibrary.callLibraryApi('POST', { action: 'cancel_reservation', loan_id: loan.loan_id });
            await loadMyBooks();
        } catch (error) {
            alert(error.message);
        }
    }

    async function leaveWaitlist(entry) {
        if (!confirm('Leave the waitlist for "' + entry.title + '"? You will lose your place in line.')) return;
        try {
            await TLCLibrary.callLibraryApi('POST', { action: 'leave_waitlist', book_id: entry.book_id });
            await loadMyBooks();
        } catch (error) {
            alert(error.message);
        }
    }

    function switchList(listName) {
        activeList = listName;
        sidebarItems.forEach((item) => item.classList.toggle('sidebar_item--active', item.dataset.list === listName));
        render();
    }

    sidebarItems.forEach((item) => {
        item.addEventListener('click', () => switchList(item.dataset.list));
        item.addEventListener('keydown', (event) => { if (event.key === 'Enter') switchList(item.dataset.list); });
    });
    searchInput.addEventListener('input', render);
    filterSelect.addEventListener('change', render);

    // my_books.html#history opens the History list directly (the header "History" link uses this).
    function applyHashToList() {
        const listFromHash = location.hash.replace('#', '');
        if (LIST_SETTINGS[listFromHash]) switchList(listFromHash);
    }
    window.addEventListener('hashchange', applyHashToList);
    if (LIST_SETTINGS[location.hash.replace('#', '')]) {
        activeList = location.hash.replace('#', '');
        sidebarItems.forEach((item) => item.classList.toggle('sidebar_item--active', item.dataset.list === activeList));
    }

    loadMyBooks();
})();