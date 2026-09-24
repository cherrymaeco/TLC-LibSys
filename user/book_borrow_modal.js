const borrowModal = document.getElementById('borrow_modal');
const borrowCloseButton = document.querySelector('.borrow_modal_close');
const cancelBorrowButton = document.querySelector('.cancel_btn');
const borrowForm = document.getElementById('borrow_form');
const borrowBookTitle = document.getElementById('borrow_book_title');
const borrowBookAuthor = document.getElementById('borrow_book_author');
const borrowerNameInput = document.getElementById('borrower_name');
const borrowerEmailInput = document.getElementById('borrower_email');
const dueDateInput = document.getElementById('borrow_due_date');

let currentBook = null;   // the book the student clicked "Borrow" on

function todayISO() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function openBorrowModal(button) {
    const card = button.closest('.book_card');
    const details = window.TLCBookDetails?.getBook(button.id);
    currentBook = {
        id: button.id,
        title: card?.querySelector('.book_info h3')?.textContent.trim() || 'Unknown Title',
        author: card?.querySelector('.book_info p span')?.textContent.trim() || 'Unknown Author',
        ISBN: details?.isbn || ''
    };

    borrowBookTitle.textContent = currentBook.title;
    borrowBookAuthor.textContent = currentBook.author;
    borrowerNameInput.value = '';
    borrowerEmailInput.value = '';
    dueDateInput.value = '';
    dueDateInput.min = todayISO();   // can't pick a due date in the past
    borrowModal.classList.add('is_open');
    borrowModal.setAttribute('aria-hidden', 'false');
    borrowerNameInput.focus();
}

function closeBorrowModal() {
    borrowModal.classList.remove('is_open');
    borrowModal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.book_actions button:not(.details_button)').forEach((button) => {
    button.addEventListener('click', () => {
        openBorrowModal(button.closest('.book_card').querySelector('.details_button'));
    });
});

borrowCloseButton.addEventListener('click', closeBorrowModal);
cancelBorrowButton.addEventListener('click', closeBorrowModal);

borrowModal.addEventListener('click', (event) => {
    if (event.target === borrowModal) {
        closeBorrowModal();
    }
});

borrowForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const borrowerName = borrowerNameInput.value.trim();
    const borrowerEmail = borrowerEmailInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!borrowerName || !borrowerEmail || !dueDate) {
        alert('Please fill in your name, email, and due date.');
        return;
    }

    const confirmButton = borrowForm.querySelector('.confirm_btn');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Saving...';

    try {
        const saveResult = await window.TLCMyBooks.saveBorrowRecord({
            borrowerName: borrowerName,
            email: borrowerEmail,
            ISBN: currentBook.ISBN,
            title: currentBook.title,
            author: currentBook.author,
            dueDate: dueDate
        });

        const emailWarning = Array.isArray(saveResult.emailWarnings) && saveResult.emailWarnings.length
            ? '\n\nEmail warning:\n' + saveResult.emailWarnings.join('\n')
            : '';
        alert(`Book borrowed by ${borrowerName} until ${dueDate}.${emailWarning}`);
        closeBorrowModal();
        borrowForm.reset();
        window.TLCMyBooks.showMyBooks();   // refresh the My Books section
    } catch (error) {
        alert('Sorry, the borrow could not be saved.\n' + error.message);
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = 'Confirm';
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && borrowModal.classList.contains('is_open')) {
        closeBorrowModal();
    }
});
