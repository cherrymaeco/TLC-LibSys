const borrowModal = document.getElementById('borrow_modal');
const borrowCloseButton = document.querySelector('.borrow_modal_close');
const cancelBorrowButton = document.querySelector('.cancel_btn');
const borrowForm = document.getElementById('borrow_form');
const borrowBookTitle = document.getElementById('borrow_book_title');
const borrowBookAuthor = document.getElementById('borrow_book_author');
const borrowerNameInput = document.getElementById('borrower_name');
const dueDateInput = document.getElementById('borrow_due_date');

const borrowBookData = {
    book1: { title: 'The Lessons of History', author: 'Ariel Durant and Will Durant' },
    book2: { title: 'The Merriam-Webster Dictionary', author: 'Merriam-Webster' },
    book3: { title: "Merriam-Webster's Collegiate Dictionary (Twelfth Edition)", author: 'Merriam-Webster' },
    book4: { title: 'Book Title 1', author: 'John Doe' },
    book5: { title: 'Book Title 1', author: 'John Doe' }
};

function openBorrowModal(button) {
    const book = borrowBookData[button.id] || {
        title: button.closest('.book_card')?.querySelector('.book_info h3')?.textContent.trim() || 'Unknown Title',
        author: button.closest('.book_card')?.querySelector('.book_info p')?.textContent.replace('Author:', '').trim() || 'Unknown Author'
    };

    borrowBookTitle.textContent = book.title;
    borrowBookAuthor.textContent = book.author;
    borrowerNameInput.value = '';
    dueDateInput.value = '';
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

borrowForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const borrowerName = borrowerNameInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!borrowerName || !dueDate) {
        alert('Please fill in both the borrower name and due date.');
        return;
    }

    alert(`Book borrowed by ${borrowerName} until ${dueDate}.`);
    closeBorrowModal();
    borrowForm.reset();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && borrowModal.classList.contains('is_open')) {
        closeBorrowModal();
    }
});
