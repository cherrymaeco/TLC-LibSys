// reserve a copy (or join the waitlist). The student's name and email
const borrowModal = document.getElementById('borrow_modal');
const borrowCloseButton = borrowModal.querySelector('.borrow_modal_close');
const cancelBorrowButton = borrowModal.querySelector('.cancel_btn');
const borrowForm = document.getElementById('borrow_form');
const confirmBorrowButton = borrowForm.querySelector('.confirm_btn');
const borrowContainer = document.getElementById('browse_books_container');

let selectedBook = null;
let borrowTrigger = null;

function openBorrowModal(bookId, trigger) {
    const viewer = TLCCatalog.getViewer();
    if (!viewer) {
        alert('Please sign in to borrow books.');
        return;
    }
    if (viewer.role !== 'student') {
        alert('Only student accounts can borrow books.');
        return;
    }

    selectedBook = TLCCatalog.getBook(bookId);
    if (!selectedBook) return;
    borrowTrigger = trigger;

    const rules = TLCCatalog.getRules();
    const willJoinWaitlist = Number(selectedBook.copies_available) < 1;

    document.getElementById('borrow_book_title').textContent = selectedBook.title;
    document.getElementById('borrow_book_author').textContent = selectedBook.author;
    document.getElementById('borrow_borrower_name').textContent = viewer.name;
    document.getElementById('borrow_borrower_email').textContent = viewer.email;

    document.getElementById('borrow_terms').textContent = willJoinWaitlist
        ? 'All copies are currently out. You will join the waitlist as number ' + (selectedBook.waitlist_count + 1) +
          ' in line. When a copy is returned it is reserved for you automatically, and you will have ' +
          rules.pickup_window_days + ' days to pick it up at the school library.'
        : 'A copy will be held for you at the school library. Pick it up within ' + rules.pickup_window_days +
          ' days or the reservation is released. Once picked up, you may keep it for ' +
          rules.loan_period_days + ' days.';

    confirmBorrowButton.textContent = willJoinWaitlist ? 'Join Waitlist' : 'Reserve Book';
    borrowModal.classList.add('is_open');
    borrowModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        if (borrowModal.classList.contains('is_open')) borrowCloseButton.focus();
    });
}

function closeBorrowModal() {
    borrowModal.classList.remove('is_open');
    borrowModal.setAttribute('aria-hidden', 'true');
    selectedBook = null;
    const trigger = borrowTrigger;
    borrowTrigger = null;
    requestAnimationFrame(() => {
        if (trigger && trigger.isConnected) trigger.focus();
    });
}

borrowContainer.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const borrowButton = event.target.closest('.borrow_button');
    if (borrowButton && !borrowButton.disabled) openBorrowModal(borrowButton.dataset.bookId, borrowButton);
});
borrowCloseButton.addEventListener('click', closeBorrowModal);
cancelBorrowButton.addEventListener('click', closeBorrowModal);
borrowModal.addEventListener('click', (event) => { if (event.target === borrowModal) closeBorrowModal(); });
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && borrowModal.classList.contains('is_open')) closeBorrowModal();
});

borrowForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedBook) return;
    const buttonLabel = confirmBorrowButton.textContent;
    confirmBorrowButton.disabled = true;
    confirmBorrowButton.textContent = 'Saving...';

    try {
        const result = await TLCLibrary.callLibraryApi('POST', { action: 'borrow', book_id: selectedBook.book_id });

        if (result.result === 'reserved') {
            alert('Reserved! Please pick up "' + result.title + '" at the school library by ' +
                  TLCLibrary.formatDate(result.pickup_deadline) + '. You may keep it for ' +
                  result.loan_period_days + ' days after pickup.');
        } else {
            alert('You are number ' + result.position + ' in line for "' + result.title +
                  '". Check My Books > Waitlist to follow your place.');
        }
        closeBorrowModal();
        TLCCatalog.refresh();   // card buttons and availability update
    } catch (error) {
        alert('Sorry, that could not be saved.\n' + error.message);
        TLCCatalog.refresh();
    } finally {
        confirmBorrowButton.disabled = false;
        confirmBorrowButton.textContent = buttonLabel;
    }
});
