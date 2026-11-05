// collection.js — loads books from books_api.php and handles add / edit / delete.
const BOOKS_API_URL = 'books_api.php';

const booksTableBody     = document.getElementById('books_table_body');
const booksMessage       = document.getElementById('books_message');
const booksMessageRow    = document.getElementById('books_message_row');
const searchInput        = document.getElementById('book_search');
const statusFilterSelect = document.getElementById('status_filter');
const openAddButton      = document.getElementById('open_add_book');

const bookModalElement   = document.getElementById('book_form_modal');
const bookModalTitle     = document.getElementById('book_form_title');
const bookFormElement    = document.getElementById('book_form');
const bookFormErrors     = document.getElementById('book_form_errors');
const cancelFormButton   = document.getElementById('cancel_book_form');
const closeFormButton    = document.getElementById('close_book_form');
const saveFormButton     = document.getElementById('save_book_button');

let allBooks = [];   // the latest list from the server

// ---------- talking to the server ----------
async function callBooksApi(method, bodyObject) {
    const requestOptions = { method: method, credentials: 'same-origin' };
    if (bodyObject instanceof FormData) {
        requestOptions.body = bodyObject;
    } else if (bodyObject) {
        requestOptions.headers = { 'Content-Type': 'application/json' };
        requestOptions.body = JSON.stringify(bodyObject);
    }

    const response = await fetch(BOOKS_API_URL, requestOptions);
    console.log("API Response Status:", response.status); 
    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error('The server returned an invalid response.');
    }
    if (!response.ok && result.ok) {
        throw new Error('The request failed with HTTP ' + response.status + '.');
    }
    if (!result.ok) {
        throw new Error((result.errors || [result.error || 'Unknown error.']).join('\n'));
    }
    return result;
}

async function loadBooks() {
    booksMessage.textContent = 'Loading...';
    try {
        const result = await callBooksApi('GET');
        allBooks = result.books;
        renderBooks();
    } catch (error) {
        booksMessage.textContent = 'Could not load books: ' + error.message;
    }
}

// ---------- drawing the table ----------
function createCell(rowElement, text) {
    const cell = document.createElement('td');
    cell.textContent = text || '—';   // textContent keeps user input safe from HTML injection
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

function getVisibleBooks() {
    const searchText = searchInput.value.trim().toLowerCase();
    const statusChoice = statusFilterSelect.value;

    return allBooks.filter((book) => {
        const matchesStatus = statusChoice === 'all' || book.status === statusChoice;
        const searchableText = [book.title, book.author, book.isbn, book.category].join(' ').toLowerCase();
        return matchesStatus && searchableText.includes(searchText);
    });
}

function renderBooks() {
    const visibleBooks = getVisibleBooks();
    booksTableBody.replaceChildren(booksMessageRow);

    visibleBooks.forEach((book) => {
        const rowElement = document.createElement('tr');
        const coverCell = document.createElement('td');
        if (book.cover_image) {
            const coverImage = document.createElement('img');
            coverImage.src = '../' + book.cover_image;
            coverImage.alt = 'Cover of ' + book.title;
            coverImage.className = 'book_cover_thumbnail';
            coverCell.appendChild(coverImage);
        } else {
            coverCell.textContent = '—';
        }
        rowElement.appendChild(coverCell);
        createCell(rowElement, book.isbn);
        createCell(rowElement, book.title);
        createCell(rowElement, book.author);
        createCell(rowElement, book.publication_year);
        createCell(rowElement, book.category);
        createCell(rowElement, book.format);
        createCell(rowElement, book.status).className = 'status_' + book.status.toLowerCase();
        createCell(rowElement, book.borrower_name);
        createCell(rowElement, book.due_date);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'row_actions';
        actionsCell.appendChild(createActionButton('Edit', 'edit_btn', () => openBookForm(book)));
        actionsCell.appendChild(createActionButton('Delete', 'delete_btn', () => deleteBook(book)));
        rowElement.appendChild(actionsCell);

        booksTableBody.appendChild(rowElement);
    });

    booksMessage.textContent = visibleBooks.length
        ? visibleBooks.length + ' of ' + allBooks.length + ' books shown.'
        : 'No books found.';
}

// ---------- add / edit form ----------
function openBookForm(bookToEdit) {
    bookFormElement.reset();
    bookFormErrors.textContent = '';
    bookFormElement.elements.cover_image.value = '';

    if (bookToEdit) {
        bookModalTitle.textContent = 'Edit Book';
        saveFormButton.textContent = 'Save Changes';
        bookFormElement.elements.book_id.value          = bookToEdit.book_id;
        bookFormElement.elements.title.value            = bookToEdit.title;
        bookFormElement.elements.author.value           = bookToEdit.author;
        bookFormElement.elements.isbn.value             = bookToEdit.isbn || '';
        bookFormElement.elements.publication_year.value = bookToEdit.publication_year;
        bookFormElement.elements.category.value         = bookToEdit.category;
        bookFormElement.elements.format.value           = bookToEdit.format;
    } else {
        bookModalTitle.textContent = 'Add New Book';
        saveFormButton.textContent = 'Add Book';
        bookFormElement.elements.book_id.value = '';
    }
    bookModalElement.classList.add('is_open');
    bookFormElement.elements.title.focus();
}

function closeBookForm() {
    bookModalElement.classList.remove('is_open');
}

bookFormElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(bookFormElement);
    const isEditing = formData.get('book_id') !== '';
    if (isEditing) formData.append('_method', 'PUT');

    saveFormButton.disabled = true;
    bookFormErrors.textContent = '';
    try {
        await callBooksApi('POST', formData);
        closeBookForm();
        await loadBooks();
    } catch (error) {
        bookFormErrors.textContent = error.message;   // shows validation errors inside the modal
    } finally {
        saveFormButton.disabled = false;
    }
});

// ---------- delete ----------
async function deleteBook(book) {
    if (!confirm('Delete "' + book.title + '"? This cannot be undone.')) return;
    try {
        await callBooksApi('DELETE', { book_id: book.book_id });
        await loadBooks();
    } catch (error) {
        alert(error.message);
    }
}

// ---------- wiring ----------
openAddButton.addEventListener('click', () => openBookForm(null));
cancelFormButton.addEventListener('click', closeBookForm);
closeFormButton.addEventListener('click', closeBookForm);
bookModalElement.addEventListener('click', (event) => {
    if (event.target === bookModalElement) closeBookForm();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeBookForm();
});
searchInput.addEventListener('input', renderBooks);
statusFilterSelect.addEventListener('change', renderBooks);

loadBooks();
