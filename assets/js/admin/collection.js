//Collection page: list, add, edit, archive/restore, view waitlist.
const BOOKS_API_URL = 'books_api.php';
const ADMIN_API_URL = 'admin_api.php';

const booksTableBody     = document.getElementById('books_table_body');
const booksMessage       = document.getElementById('books_message');
const booksMessageRow    = document.getElementById('books_message_row');
const searchInput        = document.getElementById('book_search');
const statusFilterSelect = document.getElementById('status_filter');
const archiveViewSelect  = document.getElementById('archive_view');
const openAddButton      = document.getElementById('open_add_book');

const bookModalElement   = document.getElementById('book_form_modal');
const bookModalTitle     = document.getElementById('book_form_title');
const bookFormElement    = document.getElementById('book_form');
const bookFormErrors     = document.getElementById('book_form_errors');
const cancelFormButton   = document.getElementById('cancel_book_form');
const closeFormButton    = document.getElementById('close_book_form');
const saveFormButton     = document.getElementById('save_book_button');
const coverFileInput     = document.getElementById('cover_image');
const coverPreviewImage  = document.getElementById('cover_preview_image');
const coverPreviewHolder = document.getElementById('cover_preview_placeholder');
const coverPreviewCaption = document.getElementById('cover_preview_caption');

const waitlistModal      = document.getElementById('waitlist_modal');
const waitlistTitle      = document.getElementById('waitlist_modal_title');
const waitlistMessage    = document.getElementById('waitlist_modal_message');
const waitlistBody       = document.getElementById('waitlist_modal_body');
const closeWaitlistButton = document.getElementById('close_waitlist_modal');

let allBooks = [];                 // latest list from the server
let existingCoverUrl = '';         // cover of the book being edited (if any)
let pendingPreviewUrl = '';        // object URL of a newly chosen file (revoked when replaced)

const isArchiveView = () => archiveViewSelect.value === 'archived';
const coverUrlFor = (coverPath) => (coverPath ? '../' + coverPath : '');   // pages live one folder deep

// ---------- talking to the server ----------
async function callBooksApi(method, requestBody, queryString = '') {
    const requestOptions = { method: method, credentials: 'same-origin', cache: 'no-store' };
    if (requestBody instanceof FormData) {
        requestOptions.body = requestBody;                 // file upload: browser sets the headers
    } else if (requestBody) {
        requestOptions.headers = { 'Content-Type': 'application/json' };
        requestOptions.body = JSON.stringify(requestBody);
    }
    const response = await fetch(BOOKS_API_URL + queryString, requestOptions);
    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error('The server returned an invalid response (HTTP ' + response.status + ').');
    }
    if (!result.ok) {
        throw new Error((result.errors || [result.error || 'Unknown error.']).join('\n'));
    }
    return result;
}

async function loadBooks() {
    showMessage('Loading...');
    try {
        const result = await callBooksApi('GET', null, isArchiveView() ? '?archived=1' : '');
        allBooks = result.books;
        renderBooks();
    } catch (error) {
        showMessage('Could not load books: ' + error.message);
    }
}

// ---------- drawing the table ----------
function showMessage(text) {
    booksMessage.textContent = text;
    booksTableBody.replaceChildren(booksMessageRow);
}

function createCell(rowElement, text) {
    const cell = document.createElement('td');
    cell.textContent = (text === null || text === undefined || text === '') ? '—' : text;   // textContent = safe
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
        const matchesStatus = isArchiveView() || statusChoice === 'all' || book.status === statusChoice;
        const searchableText = [book.title, book.author, book.isbn, book.category].join(' ').toLowerCase();
        return matchesStatus && searchableText.includes(searchText);
    });
}

function renderBooks() {
    const visibleBooks = getVisibleBooks();
    if (!visibleBooks.length) {
        showMessage(isArchiveView() ? 'No archived books.' : 'No books found.');
        return;
    }
    booksTableBody.replaceChildren();

    visibleBooks.forEach((book) => {
        const rowElement = document.createElement('tr');

        const coverCell = document.createElement('td');
        if (book.cover_image) {
            const thumbElement = document.createElement('img');
            thumbElement.className = 'cover_thumb';
            thumbElement.src = coverUrlFor(book.cover_image);
            thumbElement.alt = '';
            coverCell.appendChild(thumbElement);
        } else {
            coverCell.textContent = '—';
        }
        rowElement.appendChild(coverCell);

        createCell(rowElement, book.isbn);
        createCell(rowElement, book.title);
        createCell(rowElement, book.author);
        createCell(rowElement, book.publication_year);
        createCell(rowElement, book.category);
        // Temporarily hidden until the format option is ready to be added back.
        // createCell(rowElement, book.format);
        createCell(rowElement, isArchiveView() ? 'Archived' : book.status).className =
            'status_' + (isArchiveView() ? 'borrowed' : book.status.toLowerCase());
        createCell(rowElement, book.copies_available);
        createCell(rowElement, book.copies_total);

        const waitlistCell = document.createElement('td');
        if (Number(book.waitlist_count) > 0) {
            waitlistCell.appendChild(createActionButton(book.waitlist_count + ' waiting', 'waitlist_link_btn', () => openWaitlistModal(book)));
        } else {
            waitlistCell.textContent = '—';
        }
        rowElement.appendChild(waitlistCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'row_actions';
        if (isArchiveView()) {
            actionsCell.appendChild(createActionButton('Restore', 'edit_btn', () => restoreBook(book)));
        } else {
            actionsCell.appendChild(createActionButton('Edit', 'edit_btn', () => openBookForm(book)));
            actionsCell.appendChild(createActionButton('Archive', 'delete_btn', () => archiveBook(book)));
        }
        rowElement.appendChild(actionsCell);

        booksTableBody.appendChild(rowElement);
    });
}

// ---------- add / edit form + cover preview ----------
function showCoverPreview(imageUrl, captionText) {
    coverPreviewImage.hidden = !imageUrl;
    coverPreviewHolder.hidden = !!imageUrl;
    if (imageUrl) coverPreviewImage.src = imageUrl;
    coverPreviewCaption.textContent = captionText || '';
}

function clearPendingPreview() {
    if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
        pendingPreviewUrl = '';
    }
}

coverFileInput.addEventListener('change', () => {
    clearPendingPreview();
    const chosenFile = coverFileInput.files[0];
    if (chosenFile) {
        pendingPreviewUrl = URL.createObjectURL(chosenFile);
        showCoverPreview(pendingPreviewUrl, 'New cover (not saved yet)');
    } else {
        showCoverPreview(existingCoverUrl, existingCoverUrl ? 'Current cover' : '');
    }
});

function openBookForm(bookToEdit) {
    bookFormElement.reset();
    clearPendingPreview();
    bookFormErrors.textContent = '';
    existingCoverUrl = '';

    if (bookToEdit) {
        bookModalTitle.textContent = 'Edit Book';
        saveFormButton.textContent = 'Save Changes';
        const formFields = bookFormElement.elements;
        formFields.book_id.value          = bookToEdit.book_id;
        formFields.title.value            = bookToEdit.title;
        formFields.author.value           = bookToEdit.author;
        formFields.isbn.value             = bookToEdit.isbn || '';
        formFields.publication_year.value = bookToEdit.publication_year;
        formFields.category.value         = bookToEdit.category;
        // Temporarily hidden until the format option is ready to be added back.
        // if (formFields.format) formFields.format.value = bookToEdit.format;
        formFields.copies_total.value     = bookToEdit.copies_total;
        formFields.description.value      = bookToEdit.description || '';
        existingCoverUrl = coverUrlFor(bookToEdit.cover_image);
        showCoverPreview(existingCoverUrl, existingCoverUrl ? 'Current cover' : '');
    } else {
        bookModalTitle.textContent = 'Add New Book';
        saveFormButton.textContent = 'Add Book';
        bookFormElement.elements.book_id.value = '';
        bookFormElement.elements.copies_total.value = 1;
        showCoverPreview('', '');
    }
    bookModalElement.classList.add('is_open');
    bookFormElement.elements.title.focus();
}

function closeBookForm() {
    bookModalElement.classList.remove('is_open');
    clearPendingPreview();
}

bookFormElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(bookFormElement);
    const isEditing = formData.get('book_id') !== '';
    if (isEditing) formData.append('_method', 'PUT');   // PHP can't read a multipart PUT, so we tunnel it

    saveFormButton.disabled = true;
    bookFormErrors.textContent = '';
    try {
        await callBooksApi('POST', formData);
        closeBookForm();
        await loadBooks();
    } catch (error) {
        bookFormErrors.textContent = error.message;
    } finally {
        saveFormButton.disabled = false;
    }
});

// ---------- archive / restore ----------
async function archiveBook(book) {
    if (!confirm('Archive "' + book.title + '"? Students will no longer see it. You can restore it later.')) return;
    try {
        await callBooksApi('DELETE', { book_id: book.book_id });
        await loadBooks();
    } catch (error) {
        alert(error.message);
    }
}

async function restoreBook(book) {
    try {
        await callBooksApi('PUT', { book_id: book.book_id, action: 'restore' });
        await loadBooks();
    } catch (error) {
        alert(error.message);
    }
}

// ---------- waitlist modal ----------
async function openWaitlistModal(book) {
    waitlistTitle.textContent = 'Waitlist — ' + book.title;
    waitlistMessage.textContent = 'Loading...';
    waitlistBody.replaceChildren();
    waitlistModal.classList.add('is_open');

    try {
        const response = await fetch(ADMIN_API_URL + '?action=waitlist&book_id=' + encodeURIComponent(book.book_id),
            { credentials: 'same-origin', cache: 'no-store' });
        const result = await response.json();
        if (!result.ok) throw new Error((result.errors || ['Unknown error.']).join('\n'));

        waitlistMessage.textContent = result.entries.length ? 'First come, first served.' : 'Nobody is waiting for this book.';
        result.entries.forEach((entry, index) => {
            const rowElement = document.createElement('tr');
            createCell(rowElement, index + 1);
            createCell(rowElement, entry.student_name);
            createCell(rowElement, entry.student_email);
            createCell(rowElement, entry.course ? entry.course + ' ' + entry.year_level : '');
            createCell(rowElement, new Date(entry.joined_at.replace(' ', 'T')).toLocaleDateString('en-US',
                { year: 'numeric', month: 'short', day: 'numeric' }));
            waitlistBody.appendChild(rowElement);
        });
    } catch (error) {
        waitlistMessage.textContent = 'Could not load the waitlist: ' + error.message;
    }
}

function closeWaitlistModal() {
    waitlistModal.classList.remove('is_open');
}

// ---------- wiring ----------
openAddButton.addEventListener('click', () => openBookForm(null));
cancelFormButton.addEventListener('click', closeBookForm);
closeFormButton.addEventListener('click', closeBookForm);
closeWaitlistButton.addEventListener('click', closeWaitlistModal);
bookModalElement.addEventListener('click', (event) => { if (event.target === bookModalElement) closeBookForm(); });
waitlistModal.addEventListener('click', (event) => { if (event.target === waitlistModal) closeWaitlistModal(); });
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeBookForm(); closeWaitlistModal(); }
});
searchInput.addEventListener('input', renderBooks);
statusFilterSelect.addEventListener('change', renderBooks);
archiveViewSelect.addEventListener('change', () => {
    openAddButton.hidden = isArchiveView();        // no adding while viewing the archive
    statusFilterSelect.hidden = isArchiveView();   // status filter only matters for active books
    loadBooks();
});

loadBooks();