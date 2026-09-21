const bookModal = document.getElementById('book_details_modal');
const closeModalButton = bookModal.querySelector('.modal_close');
const modalTitle = document.getElementById('modal_book_title');
const modalAuthor = document.getElementById('modal_book_author');
const modalPublished = document.getElementById('published');
const modalPublisher = document.getElementById('publisher');
const modalGenre = document.getElementById('genre');
const modalLanguage = document.getElementById('language');
const modalPageCount = document.getElementById('page_count');
const modalDescription = document.getElementById('modal_book_description');
const googleBooksLink = document.getElementById('google_books_link');
const viewerCanvas = document.getElementById('viewerCanvas');
const viewerMessage = document.getElementById('viewer_message');
let bookViewer;

const bookData = {
    book1: {
        title: 'The Lessons of History',
        author: 'Ariel Durant and Will Durant',
        year: '1968',
        genre: 'History',
        publisher: 'Simon & Schuster',
        pageCount: '117',
        language: 'English',
        status: 'Available',
        format: 'E-Book',
        cover: '../imgs/book1.jpg',
        description: `In this illuminating and thoughtful book, Will and Ariel Durant have succeeded in distilling 
        for the reader the accumulated store of knowledge and experience from their four decades of work on the ten monumental 
        volumes of The Story of Civilization. The result is a survey of human history, full of dazzling insights into the nature 
        of human experience, the evolution of civilization, the culture of man. With the completion of their life's work they look 
        back and ask what history has to say about the nature, the conduct and the prospects of man, seeking in the great lives, the 
        great ideas, the great events of the past for the meaning of man's long journey through war, conquest and creation -- and for 
        the great themes that can help us to understand our own era. To the Durants, history is "not merely a warning reminder of man's 
        follies and crimes, but also an encouraging remembrance of generative souls ... a spacious country of the mind, wherein a thousand 
        saints, statesmen, inventors, scientists, poets, artists, musicians, lovers, and philosophers still live and speak, teach and carve 
        and sing ..." Designed to accompany the ten-volume set of The Story of Civilization, The Lessons of History is, 
        in its own right, a profound and original work of history and philosophy.`,
        isbn: '143914995X'
    },
    book2: {
        title: 'The Merriam-Webster Dictionary',
        author: 'Merriam-Webster',
        year: '2020',
        genre: 'Reference',
        publisher: 'Merriam-Webster inc.',
        pageCount: '960',
        language: 'English',
        status: 'Available',
        format: 'Physical',
        cover: '../imgs/book2.jpg',
        description: `More than 75,000 definitions and 8,000 usage examples aid understanding―and cover the words you need today. 
        Includes pronunciations, word origins, and synonym lists. 
        Features useful tables and special sections on Foreign Words & Phrases and Geographical Names`,
        isbn: '0877792932'
    },
    book3: {
        title: "Merriam-Webster's Collegiate Dictionary (Twelfth Edition)",
        author: 'Merriam-Webster',
        year: '2020',
        genre: 'Reference',
        publisher: 'Merriam-Webster inc.',
        pageCount: '1000',
        language: 'English',
        status: 'Available',
        format: 'Physical',
        cover: '../imgs/book3.jpg',
        description: 'A trusted language reference offering definitions, pronunciation guides, and comprehensive word entries for everyday and academic use.',
        isbn: '0877794065'
    },
    book4: {
        title: 'The Structure of Scientific Revolutions',
        author: 'Thomas S. Kuhn',
        year: '2012',
        genre: 'Science',
        publisher: 'University of Chicago Press',
        pageCount: '212',
        status: 'Available',
        format: 'E-Book',
        cover: '../imgs/book4.jpg',
        description: `A good book may have the power to change the way we see the world, but a great book actually becomes part of our daily consciousness, 
        pervading our thinking to the point that we take it for granted, and we forget how provocative and challenging its ideas once were—and still are. The Structure of Scientific Revolutions 
        is that kind of book. When it was first published in 1962, it was a landmark event in the history and philosophy of science. Fifty years later, it still has many lessons to teach.

        With The Structure of Scientific Revolutions, Kuhn challenged long-standing linear notions of scientific progress, arguing that transformative ideas don’t 
        arise from the day-to-day, gradual process of experimentation and data accumulation but that the revolutions in science, those breakthrough moments that disrupt 
        accepted thinking and offer unanticipated ideas, occur outside of “normal science,” as he called it. Though Kuhn was writing when physics ruled the sciences, his ideas on how scientific 
        revolutions bring order to the anomalies that amass over time in research experiments are still instructive in our biotech age.

        This new edition of Kuhn’s essential work in the history of science includes an insightful introduction by Ian Hacking, which clarifies terms popularized by Kuhn,
         including paradigm and incommensurability, and applies Kuhn’s ideas to the science of today. Usefully keyed to the separate sections of the book, Hacking’s introduction provides important 
         background information as well as a contemporary context. Newly designed, with an expanded index, this edition will be eagerly welcomed by the next generation of readers seeking to understand 
         the history of our perspectives on science.`,
        isbn: '0226458148'
    },
    book5: {
        title: 'The Well-Educated Mind',
        author: 'Susan Wise Bauer',
        year: '2015',
        genre: 'General',
        publisher: 'W. W. Norton',
        pageCount: '480',
        status: 'Available',
        format: 'E-Book',
        cover: '../imgs/book1.jpg',
        description: `Newly expanded and updated to include standout works from the twenty-first century as well as essential readings in science 
        (from the earliest works of Hippocrates to the discovery of the asteroid that killed the dinosaurs), The Well-Educated Mind offers brief, entertaining histories 
        of six literary genres—fiction, autobiography, history, drama, poetry, and science—accompanied by detailed instructions on how to read each type. The annotated 
        lists at the end of each chapter—ranging from Cervantes to Cormac McCarthy, Herodotus to Laurel Thatcher Ulrich, Aristotle to Stephen Hawking—preview recommended 
        reading and encourage readers to make vital connections between ancient traditions and contemporary writing.

        The Well-Educated Mind reassures those readers who worry that they read too slowly or with below-average comprehension. 
        If you can understand a daily newspaper, there’s no reason you can’t read and enjoy Shakespeare’s sonnets or Jane Eyre. 
        But no one should attempt to read the “Great Books” without a guide and a plan. Bauer will show you how to allocate time to reading on a 
        regular basis; how to master difficult arguments; how to make personal and literary judgments about what you read; how to appreciate the resonant 
        links among texts within a genre—what does Anna Karenina owe to Madame Bovary?—and also between genres.`,
        isbn: '0393253910'
    },
    book6: {
        title: 'Understanding Life Through Science for Grade 1',
        author: 'Wilma Lyn N. Aldon, Javiez & Torres, PhD',
        year: '2015',
        genre: 'Science',
        publisher: 'Phoenix Publishing House.',
        pageCount: '150',
        status: 'Available',
        format: 'Physical',
        cover: '../imgs/book6.jpg',
        description: `The book is structured to deepen the connection between fundamental science concepts and real-world scenarios, fostering 
        early scientific literacy across environmental, technical, and engineering fields.`,
        isbn: ''
    },
    book7: {
        title: 'Cora Cooks Pancit',
        author: 'Dorina K. Lazo Gilmore',
        year: '2009',
        genre: 'Fiction',
        publisher: 'Shen\'s Books',
        pageCount: '32',
        status: 'Available',
        format: 'Physical',
        cover: '../imgs/book7.jpg',
        description: `Cora longs to help in the kitchen, but she's always told 
        she's too little. When her chance finally comes, she learns about her family's Filipino heritage while making pancit. A warm story 
        about family, culture, and gaining confidence in the kitchen.`,
        isbn: '9781885008329'
    },
    book8: {
        title: 'The Tale of Benjamin Bunny',
        author: 'Beatrix Potter',
        year: '1904',
        genre: 'Fiction',
        publisher: 'Franklin Watts.',
        pageCount: '58',
        status: 'Available',
        format: 'E-book',
        cover: '../imgs/book8.jpg',
        description: `Peter Rabbit's cousin, Benjamin Bunny, has been a very popular character since this book's first 
        publication in 1904. In this tale we hear all about his and Peter's adventures in Mr McGregor's vegetable garden, 
        and what happens to them when they meet a cat! Even more frightening, is what happens to the two pesky bunnies 
        when Old Mr Benjamin Bunny finds out what they have been up to!`,
        isbn: '1429096977'
    },
    book9: {
        title: 'The Tainted Cup',
        author: 'Robert Jackson Bennett',
        year: '2025',
        genre: 'Fantasy',
        publisher: 'Del Rey',
        pageCount: '320',
        status: 'Available',
        format: 'Physical',
        cover: '../imgs/book9.jpg',
        description: `A murder mystery set in a rich secondary world beset by leviathans and a terrifying 
        contagion where plants take root within living humans. Dinios Kol, an apprentice with perfect memory, 
        assists the brilliant and caustic investigator Ana Dolabra in solving a calculated assassination plot. 
        Winner of the Hugo Award and World Fantasy Award.`,
        isbn: ''
    },
    book10: {
        title: 'Discovering the World of Geography, Grades 7-8',
        author: 'Myrl Shireman',
        year: '2008',
        genre: 'Geography',
        publisher: 'Mark Twain Media',
        pageCount: '32',
        status: 'Available',
        format: 'E-book',
        cover: '../imgs/book10.jpg',
        description: `Explore the world with students in grades 7–8 using Discovering the World of Geography. 
        This 128-page book helps students use geographical knowledge and skills to interpret and analyze data. 
        This text covers topics including population, political landscapes, climate, understanding developed 
        and underdeveloped countries, and regions of conflict. The book presents information through activities 
        such as maps, charts, diagrams, and graphs that support National Geography Standards. It also includes 
        assessments and answer keys.`,
        isbn: '1580377890'
    }
};

google.books.load();
google.books.setOnLoadCallback(() => {
    bookViewer = new google.books.DefaultViewer(viewerCanvas);
});

function loadGooglePreview(isbn, bookTitle) {
    if (!isbn) {
        viewerCanvas.innerHTML = '<div class="preview_placeholder">Preview unavailable for this book.</div>';
        return;
    }

    const googleEmbedUrl = `https://books.google.com/books?vid=ISBN:${isbn}&printsec=frontcover&output=embed`;
    viewerCanvas.innerHTML = `<iframe src="${googleEmbedUrl}" title="${bookTitle}" loading="lazy" allowfullscreen></iframe>`;
}

function openBookModal(button) {
    const book = bookData[button.id] || {
        title: button.closest('.book_card').querySelector('.book_info h3').textContent.trim(),
        author: button.closest('.book_card').querySelector('.book_info p').textContent.trim(),
        description: 'View more information about this book in the library catalog.',
        isbn: '',
        year: '',
        genre: '',
        publisher: '',
        pageCount: '',
        language: '',
        format: 'E-Book',
    };
    const { title, author, description, isbn, year, genre, publisher, pageCount, language, format, cover } = book;
    const bookSearch = encodeURIComponent(`${title} ${author}`);
    const isPhysicalCopy = String(format).toLowerCase() === 'physical';
    const isEbook = String(format).toLowerCase() === 'e-book' || String(format).toLowerCase() === 'ebook';

    viewerCanvas.innerHTML = '';
    if (viewerMessage) viewerMessage.textContent = 'Loading preview...';

    modalTitle.textContent = title;
    modalAuthor.innerHTML = `<strong>Author: </strong>${author}`;
    modalDescription.innerHTML = `${description}`;
    modalPublished.innerHTML = `<strong>Year: </strong>${year}`;
    modalGenre.innerHTML = `<strong>Genre: </strong>${genre}`;
    modalPublisher.innerHTML = `<strong>Publisher: </strong>${publisher}`;
    modalPageCount.innerHTML = `<strong>Page Count: </strong>${pageCount}`;
    modalLanguage.innerHTML = `<strong>Language: </strong>${language}`;
    googleBooksLink.href = `https://books.google.com/books?q=${bookSearch}`;

    if (isPhysicalCopy) {
        viewerCanvas.innerHTML = `<img src="${cover}" alt="${title}" class="book_preview_cover">`;
        if (viewerMessage) viewerMessage.textContent = 'Physical copy';
    } else if (isEbook) {
        loadGooglePreview(isbn, title);
        if (viewerMessage) viewerMessage.textContent = 'E-book preview';
    } else {
        viewerCanvas.innerHTML = '<div class="preview_placeholder">Preview unavailable for this book.</div>';
        if (viewerMessage) viewerMessage.textContent = 'Preview unavailable for this book.';
    }

    bookModal.classList.add('is_open');
    bookModal.setAttribute('aria-hidden', 'false');
    closeModalButton.focus();
}

function closeBookModal() {
    bookModal.classList.remove('is_open');
    bookModal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.details_button').forEach((button) => {
    button.addEventListener('click', () => {
        openBookModal(button);
    });
});

closeModalButton.addEventListener('click', closeBookModal);

bookModal.addEventListener('click', (event) => {
    if (event.target === bookModal) {
        closeBookModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bookModal.classList.contains('is_open')) {
        closeBookModal();
    }
});
