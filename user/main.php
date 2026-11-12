<?php
session_start();
$firstInitial = '';
if (isset($_SESSION['first_name']) && is_string($_SESSION['first_name'])) {
    $firstInitial = strtoupper(substr(trim($_SESSION['first_name']), 0, 1));
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TLC LibSys</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Inspiration&family=M+PLUS+1p&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Pontano+Sans:wght@300&display=swap"
        rel="stylesheet">
    <!-- E-BOOKS preview (disabled for now): <script src="https://www.google.com/books/jsapi.js"></script> -->

    <link rel="stylesheet" href="../assets/css/User.css?v=20261112-1">
    <script src="../assets/js/user/library_client.js?v=20261108-1" defer></script>
    <script src="../assets/js/user/browse_catalog.js?v=20261112-1" defer></script>
    <script src="../assets/js/user/book_details_modal.js?v=20261112-1" defer></script>
    <script src="../assets/js/user/book_borrow_modal.js?v=20261108-1" defer></script>
    <script src="../assets/js/user/profile_menu.js" defer></script>
</head>

<body>
    <header>
        <h3>TLC<span> LibSys</span></h3>
        <nav class="main_nav">
            <a href="#home">Home</a>
            <a href="#browse_books">Browse</a>
            <a href="my_books.html#my_books">My Books</a>
            <!-- <a href="my_books.html#">History</a> -->
            <a href="#about">About</a>
        </nav>

        <div class="header_tools">
            <label class="search_box" aria-label="Search books">
                <span class="search_icon">⌕</span>
                <input type="search" placeholder="Search books...">
            </label>

            <button type="button" class="profile_btn" aria-label="Profile">
                <span class="profile_avatar"><?= htmlspecialchars($firstInitial, ENT_QUOTES, 'UTF-8') ?></span>
            </button>
        </div>
    </header>

    <div class="section" id="home">
        <div>
            <h1>Welcome to TLC LibSys</h1>
            <p>Discover a world of knowledge and imagination with our vast collection of books.</p>
            <a href="#browse_books"><button id="browse_btn">Browse</button></a>
        </div>
        <img src="../assets/imgs/homeimg.png" alt="" id="homeimg">
    </div>


    <div class="section" id="browse_books">
        <div id="browse_header_text">
            <h2>Browse Books</h2>
            <hr>
            <p>Discover our extensive collection of books across various genres.</p>
        </div>
        <div id="browse_books_container"></div>
        <p id="catalog_message" class="catalog_message"></p>
    </div>

    <!-- ========== Book Browsing Pagination =========== -->
    <div class="book_pagination" id="book_pagination" aria-label="Book browsing pagination"></div>

    <!-- ========== About Section =========== -->
    <div class="section" id="about">
        <div class="about_wrapper">
            <div class="about_text">
                <p class="section_tag">About</p>
                <h2>Building a smarter way to discover and borrow books.</h2>
                <p>
                    TLC LibSys is designed to make reading more accessible and organized for students, researchers, and everyday library users. With a simple, user-friendly interface, members can browse the collection, review details, and borrow books with ease.
                </p>
                <p>
                    Our mission is to combine a welcoming digital library experience with efficient book management so everyone can spend more time reading and less time searching.
                </p>
            </div>
            <div class="about_stats">
                <div class="stat_card">
                    <span class="stat_number">10+</span>
                    <span class="stat_label">Book Titles</span>
                </div>
                <!-- <div class="stat_card">
                    <span class="stat_number">Digital/Physical</span>
                    <span class="stat_label">Formats</span>
                </div> -->
                <div class="stat_card">
                    <span class="stat_number">24/7</span>
                    <span class="stat_label">Access</span>
                </div>
            </div>
        </div>
    </div>


    <!-- ======= Book details modal ======= -->
    <div class="book_modal" id="book_details_modal" aria-hidden="true">
        <div class="book_modal_content" role="dialog" aria-modal="true" aria-labelledby="modal_book_title">
            <div class="modal_header">
                <h3>Book Details</h3>
                <button class="modal_close" type="button" aria-label="Close book details">&times;</button>
            </div>
            <div class="modal_book_details">
                <h2 id="modal_book_title">Book details</h2>
                <p id="modal_book_author"></p>
                <p id="published"></p>
                <p id="genre"></p>
                <p id="modal_book_isbn"></p>
                <p id="modal_book_copies"></p>
                <a id="google_books_link" href="#" target="_blank" rel="noopener">Search on Google Books</a>
            </div>
            <!-- Shows the book's cover image (JS fills this in) -->
            <div id="viewerCanvas" aria-label="Book cover"></div>
        </div>
    </div>

    <!-- ======= Borrow modal: the student's name/email come from their login ======= -->
    <div class="borrow_modal" id="borrow_modal" aria-hidden="true">
        <div class="borrow_modal_content" role="dialog" aria-modal="true" aria-labelledby="borrow_modal_title">
            <div class="modal_header borrow_header">
                <h3 id="borrow_modal_title">Borrow Book</h3>
                <button class="borrow_modal_close" type="button" aria-label="Close borrow form">&times;</button>
            </div>

            <div class="borrow_summary">
                <p><strong>Title:</strong> <span id="borrow_book_title"></span></p>
                <p><strong>Author:</strong> <span id="borrow_book_author"></span></p>
                <p><strong>Borrower:</strong> <span id="borrow_borrower_name"></span></p>
                <p><strong>Email:</strong> <span id="borrow_borrower_email"></span></p>
            </div>

            <p class="borrow_terms" id="borrow_terms"></p>

            <form id="borrow_form" class="borrow_form">
                <div class="borrow_modal_actions">
                    <button type="button" class="cancel_btn">Cancel</button>
                    <button type="submit" class="confirm_btn">Reserve Book</button>
                </div>
            </form>
        </div>
    </div>
</body>

</html>