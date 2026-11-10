// book_details_modal.js — "Details" popup. Shows the book's cover image.
const bookModal = document.getElementById('book_details_modal');
const closeModalButton = bookModal.querySelector('.modal_close');
const detailsContainer = document.getElementById('browse_books_container');
const coverCanvas = document.getElementById('viewerCanvas');
let detailsTrigger = null;

function setDetailLine(elementId, labelText, valueText) {
    const lineElement = document.getElementById(elementId);
    const labelElement = document.createElement('strong');
    labelElement.textContent = labelText + ': ';
    lineElement.replaceChildren(labelElement, document.createTextNode(valueText || '—'));
}

function openBookModal(bookId, trigger) {
    const book = TLCCatalog.getBook(bookId);
    if (!book) return;
    detailsTrigger = trigger;

    document.getElementById('modal_book_title').textContent = book.title;
    setDetailLine('modal_book_author', 'Author', book.author);
    setDetailLine('published', 'Year', book.publication_year);
    setDetailLine('genre', 'Category', book.category);
    setDetailLine('modal_book_isbn', 'ISBN', book.isbn);
    setDetailLine('modal_book_copies', 'Copies available', book.copies_available + ' of ' + book.copies_total);
    document.getElementById('google_books_link').href =
        'https://books.google.com/books?q=' + encodeURIComponent(book.title + ' ' + book.author);

    // The cover image replaces the old Google Books preview.
    const coverImage = document.createElement('img');
    coverImage.className = 'book_preview_cover';
    coverImage.src = TLCLibrary.coverUrl(book.cover_image);
    coverImage.alt = 'Cover of ' + book.title;
    coverCanvas.replaceChildren(coverImage);

    /* ---------- E-BOOKS (disabled for now) ----------
       When e-books come back: load the Google Books embed instead of the cover, e.g.
         const embedUrl = 'https://books.google.com/books?vid=ISBN:' + book.isbn + '&printsec=frontcover&output=embed';
         coverCanvas.innerHTML = '<iframe src="' + embedUrl + '" allowfullscreen></iframe>';
       and add back <script src="https://www.google.com/books/jsapi.js"></script> in main.php.
    ---------------------------------------------------- */

    bookModal.classList.add('is_open');
    bookModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        if (bookModal.classList.contains('is_open')) closeModalButton.focus();
    });
}

function closeBookModal() {
    bookModal.classList.remove('is_open');
    bookModal.setAttribute('aria-hidden', 'true');
    const trigger = detailsTrigger;
    detailsTrigger = null;
    requestAnimationFrame(() => {
        if (trigger && trigger.isConnected) trigger.focus();
    });
}

// One listener on the container works for cards that are drawn later.
detailsContainer.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const detailsButton = event.target.closest('.details_button');
    if (detailsButton) openBookModal(detailsButton.dataset.bookId, detailsButton);
});
closeModalButton.addEventListener('click', closeBookModal);
bookModal.addEventListener('click', (event) => { if (event.target === bookModal) closeBookModal(); });
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bookModal.classList.contains('is_open')) closeBookModal();
});
