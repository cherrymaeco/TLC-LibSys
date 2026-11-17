(function () {
    const BOOKS_PER_PAGE = 12;

    const booksContainer = document.getElementById('browse_books_container');
    const catalogMessage = document.getElementById('catalog_message');
    const paginationElement = document.getElementById('book_pagination');
    const headerSearchInput = document.querySelector('.search_box input');

    let allBooks = [];
    let myBookStates = {};      // book_id -> 'reserved' | 'borrowed' | 'waitlisted'
    let viewerInfo = null;      // { name, email, role } or null when signed out
    let libraryRules = {};      // { loan_period_days, pickup_window_days }
    let currentPage = 1;

    async function refreshCatalog() {
        catalogMessage.textContent = 'Loading books...';
        try {
            const result = await TLCLibrary.callLibraryApi('GET', { action: 'catalog' });
            allBooks = result.books;
            myBookStates = result.my_states || {};
            viewerInfo = result.viewer;
            libraryRules = result.rules;
            renderCatalog();
        } catch (error) {
            catalogMessage.textContent = 'Could not load books: ' + error.message;
        }
    }

    function getFilteredBooks() {
        const searchText = headerSearchInput ? headerSearchInput.value.trim().toLowerCase() : '';
        return allBooks.filter((book) =>
            [book.title, book.author, book.category, book.isbn].join(' ').toLowerCase().includes(searchText)
        );
    }

    function createInfoLine(labelText, valueText, valueClassName) {
        const lineElement = document.createElement('p');
        const valueElement = document.createElement('span');
        valueElement.textContent = valueText;
        if (valueClassName) valueElement.className = valueClassName;
        lineElement.append(labelText + ' ', valueElement);
        return lineElement;
    }

    function getBorrowButtonState(book) {
        const myState = myBookStates[book.book_id];
        if (myState === 'reserved')   return { label: 'Reserved',    disabled: true };
        if (myState === 'borrowed')   return { label: 'Borrowed',    disabled: true };
        if (myState === 'waitlisted') return { label: 'On Waitlist', disabled: true };
        return { label: book.copies_available > 0 ? 'Borrow' : 'Join Waitlist', disabled: false };
    }

    function createBookCard(book) {
        const cardElement = document.createElement('div');
        cardElement.className = 'book_card';
        cardElement.dataset.bookId = book.book_id;
        cardElement.tabIndex = 0;
        cardElement.setAttribute('aria-label', 'View details for ' + book.title);

        const coverElement = document.createElement('img');
        coverElement.className = 'book_img';
        coverElement.src = TLCLibrary.coverUrl(book.cover_image);
        coverElement.alt = '';
        cardElement.appendChild(coverElement);

        const infoElement = document.createElement('div');
        infoElement.className = 'book_info';

        const titleElement = document.createElement('h3');
        titleElement.textContent = book.title;
        infoElement.appendChild(titleElement);

        infoElement.appendChild(createInfoLine('Author:', book.author));
        infoElement.appendChild(createInfoLine('Year:', book.publication_year));
        infoElement.appendChild(createInfoLine('Category:', book.category));

        const isAvailable = book.copies_available > 0;
        let statusText = isAvailable ? 'Available' : 'Unavailable';
        if (!isAvailable && book.waitlist_count > 0) {
            statusText += ' (' + book.waitlist_count + ' waiting)';
        }
        infoElement.appendChild(createInfoLine('Status:', statusText, isAvailable ? 'status_available' : 'status_unavailable'));
        const copiesText = book.copies_available + ' of ' + book.copies_total;
        infoElement.appendChild(createInfoLine('Copies:', copiesText));

        const actionsElement = document.createElement('div');
        actionsElement.className = 'book_actions';

        const borrowState = getBorrowButtonState(book);
        const borrowButton = document.createElement('button');
        borrowButton.type = 'button';
        borrowButton.className = 'borrow_button';
        borrowButton.dataset.bookId = book.book_id;
        borrowButton.textContent = borrowState.label;
        borrowButton.disabled = borrowState.disabled;

        actionsElement.appendChild(borrowButton);
        infoElement.appendChild(actionsElement);
        cardElement.appendChild(infoElement);
        return cardElement;
    }

    function renderCatalog() {
        const filteredBooks = getFilteredBooks();
        const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
        currentPage = Math.min(currentPage, totalPages);

        const pageStart = (currentPage - 1) * BOOKS_PER_PAGE;
        booksContainer.replaceChildren(
            ...filteredBooks.slice(pageStart, pageStart + BOOKS_PER_PAGE).map(createBookCard)
        );

        catalogMessage.textContent = filteredBooks.length ? '' : 'No books found.';
        renderPagination(totalPages);
    }

    function createPageButton(label, className, onClick, isDisabled) {
        const buttonElement = document.createElement('button');
        buttonElement.type = 'button';
        buttonElement.className = className;
        buttonElement.textContent = label;
        buttonElement.disabled = !!isDisabled;
        buttonElement.addEventListener('click', onClick);
        return buttonElement;
    }

    function goToPage(pageNumber) {
        currentPage = pageNumber;
        renderCatalog();
        document.getElementById('browse_books').scrollIntoView();
    }

    function renderPagination(totalPages) {
        paginationElement.replaceChildren();
        if (totalPages <= 1) return;

        const numbersElement = document.createElement('div');
        numbersElement.className = 'page_numbers';
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            const numberButton = createPageButton(
                pageNumber, 'page_number' + (pageNumber === currentPage ? ' active' : ''),
                () => goToPage(pageNumber)
            );
            numbersElement.appendChild(numberButton);
        }
        paginationElement.append(
            createPageButton('Previous', 'page_btn page_prev', () => goToPage(currentPage - 1), currentPage === 1),
            numbersElement,
            createPageButton('Next', 'page_btn page_next', () => goToPage(currentPage + 1), currentPage === totalPages)
        );
    }

    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', () => { currentPage = 1; renderCatalog(); });
    }

    // Used by book_details_modal.js and book_borrow_modal.js
    window.TLCCatalog = {
        refresh: refreshCatalog,
        getBook: (bookId) => allBooks.find((book) => Number(book.book_id) === Number(bookId)) || null,
        getViewer: () => viewerInfo,
        getRules: () => libraryRules
    };

    refreshCatalog();
})();
