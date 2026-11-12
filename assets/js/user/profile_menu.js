// profile_menu.js — turns the round profile button into a dropdown with the student's
// name, email and a Logout button. Works on every student page
(function () {
    const LOGIN_PAGE_URL = '../index.php';  
    const LOGOUT_URL = 'logout.php';

    const profileButton = document.querySelector('.profile_btn');
    if (!profileButton) return;

    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .profile_wrap { position: relative; }
        .profile_menu { position: absolute; right: 0; top: calc(100% + .6rem); z-index: 30; min-width: 15rem;
            padding: .5rem; background: #FDF2E9; color: #1E130A; border: 1px solid #7D6B5A;
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
        .profile_menu[hidden] { display: none; }
        .profile_menu_info { padding: .6rem .75rem; border-bottom: 1px solid #d9c8b8; margin-bottom: .4rem; }
        .profile_menu_name { font-weight: 800; }
        .profile_menu_email { font-size: .8rem; color: #7D6B5A; word-break: break-all; }
        .profile_menu_role { display: inline-block; margin-top: .4rem; padding: .1rem .5rem; border-radius: 999px;
            background: #3E2C1B; color: #FDF2E9; font-size: .7rem; text-transform: uppercase; letter-spacing: .05rem; }
        .profile_menu_item { display: block; width: 100%; padding: .6rem .75rem; border: 0; border-radius: 8px;
            background: transparent; color: #1E130A; font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
        .profile_menu_item:hover, .profile_menu_item:focus-visible { background: #e7ddd2; outline: 0; }
    `;
    document.head.appendChild(styleElement);

    // ---- build the menu next to the button ----
    const wrapElement = document.createElement('div');
    wrapElement.className = 'profile_wrap';
    profileButton.replaceWith(wrapElement);

    const menuElement = document.createElement('div');
    menuElement.className = 'profile_menu';
    menuElement.id = 'profile_menu';
    menuElement.setAttribute('role', 'menu');
    menuElement.hidden = true;
    wrapElement.append(profileButton, menuElement);

    profileButton.setAttribute('aria-haspopup', 'menu');
    profileButton.setAttribute('aria-expanded', 'false');
    profileButton.setAttribute('aria-controls', 'profile_menu');

    function buildMenu(viewer) {
        menuElement.replaceChildren();
        const infoElement = document.createElement('div');
        infoElement.className = 'profile_menu_info';

        if (!viewer) {
            infoElement.textContent = 'You are not signed in.';
            const signInLink = document.createElement('a');
            signInLink.className = 'profile_menu_item';
            signInLink.href = LOGIN_PAGE_URL;
            signInLink.setAttribute('role', 'menuitem');
            signInLink.textContent = 'Sign in';
            menuElement.append(infoElement, signInLink);
            return;
        }

        const nameElement = document.createElement('div');
        nameElement.className = 'profile_menu_name';
        nameElement.textContent = viewer.name;
        const emailElement = document.createElement('div');
        emailElement.className = 'profile_menu_email';
        emailElement.textContent = viewer.email;
        const roleElement = document.createElement('span');
        roleElement.className = 'profile_menu_role';
        roleElement.textContent = viewer.role;
        infoElement.append(nameElement, emailElement, roleElement);

        // A real form POST, so logout.php can destroy the session and redirect.
        const logoutForm = document.createElement('form');
        logoutForm.method = 'post';
        logoutForm.action = LOGOUT_URL;
        const logoutButton = document.createElement('button');
        logoutButton.type = 'submit';
        logoutButton.className = 'profile_menu_item';
        logoutButton.setAttribute('role', 'menuitem');
        logoutButton.textContent = 'Log out';
        logoutForm.appendChild(logoutButton);

        menuElement.append(infoElement, logoutForm);
    }

    function setAvatarInitial(viewer) {
        const avatarElement = profileButton.querySelector('.profile_avatar');
        if (avatarElement) avatarElement.textContent = viewer ? viewer.name.trim().charAt(0).toUpperCase() : '?';
    }

    function openMenu() {
        menuElement.hidden = false;
        profileButton.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        menuElement.hidden = true;
        profileButton.setAttribute('aria-expanded', 'false');
    }

    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (menuElement.hidden) openMenu(); else closeMenu();
    });
    document.addEventListener('click', (event) => {
        if (!menuElement.hidden && !wrapElement.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menuElement.hidden) {
            closeMenu();
            profileButton.focus();
        }
    });

    buildMenu(null);   // safe default until the server answers
    TLCLibrary.callLibraryApi('GET', { action: 'me' })
        .then((result) => { setAvatarInitial(result.viewer); buildMenu(result.viewer); })
        .catch(() => { /* leave the signed-out menu in place */ });
})();
