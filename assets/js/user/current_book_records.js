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
        }
    };

    let activeList = 'current';
    let myLoans = [];
    let myWaitlist = [];

    async function loadMyBooks() {
        messageElement.textContent = 'Loading...';
        tableWrapElement.hidden = true;
        try {
            const result = await TLCLibrary.callLibraryApi('GET', { action: 'my_books' });
            myLoans = result.loans;
            myWaitlist = result.waitlist;
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

    function isDueSoon(loan) {
        if (loan.loan_status !== 'Borrowed') return false;
        const [year, month, day] = loan.due_date.split('-').map(Number);
        const daysLeft = (new Date(year, month - 1, day) - new Date().setHours(0, 0, 0, 0)) / 86400000;
        return daysLeft <= 2;
    }

    function getVisibleLoans() {
        const searchText = searchInput.value.trim().toLowerCase();
        return myLoans.filter((loan) => {
            const matchesFilter =
                filterSelect.value === 'all' ||
                (filterSelect.value === 'due-soon' && isDueSoon(loan)) ||
                (filterSelect.value === 'overdue' && loan.loan_status === 'Overdue');
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

        const searchText = searchInput.value.trim().toLowerCase();
        const rowElements = activeList === 'current'
            ? getVisibleLoans().map(renderLoanRow)
            : myWaitlist
                .filter((entry) => (entry.title + ' ' + entry.author).toLowerCase().includes(searchText))
                .map(renderWaitlistRow);

        bodyElement.replaceChildren(...rowElements);
        tableWrapElement.hidden = rowElements.length === 0;
        messageElement.textContent = rowElements.length
            ? rowElements.length + (rowElements.length === 1 ? ' record found.' : ' records found.')
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

    loadMyBooks();
})();
