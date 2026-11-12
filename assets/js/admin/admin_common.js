(function () {
    const LOGIN_PAGE_URL = '../index.php';   

    const headerElement = document.querySelector('header');
    if (!headerElement) return;

    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .admin_session { margin-left: auto; margin-right: 2rem; display: flex; align-items: center; gap: .75rem; }
        .admin_session_name { font-size: .85rem; opacity: .9; }
        .admin_logout_btn { padding: .4rem 1rem; border: 1px solid #7D6B5A; border-radius: 999px;
            background: transparent; color: #FDF2E9; font: inherit; font-weight: 700; cursor: pointer; }
        .admin_logout_btn:hover { background: rgba(255,255,255,.1); border-color: #FDF2E9; }
        header nav a.nav_active { background: #d9c8b8; color: #1E130A; font-weight: bold; }
    `;
    document.head.appendChild(styleElement);

    // highlight the page we're on
    const currentPage = location.pathname.split('/').pop();
    document.querySelectorAll('header nav a').forEach((linkElement) => {
        if (linkElement.getAttribute('href') === currentPage) linkElement.classList.add('nav_active');
    });

    const sessionElement = document.createElement('div');
    sessionElement.className = 'admin_session';
    const nameElement = document.createElement('span');
    nameElement.className = 'admin_session_name';
    const logoutForm = document.createElement('form');
    logoutForm.method = 'post';
    logoutForm.action = 'logout.php';
    const logoutButton = document.createElement('button');
    logoutButton.type = 'submit';
    logoutButton.className = 'admin_logout_btn';
    logoutButton.textContent = 'Log out';
    logoutForm.appendChild(logoutButton);
    sessionElement.append(nameElement, logoutForm);
    headerElement.appendChild(sessionElement);

    fetch('admin_api.php?action=me', { credentials: 'same-origin', cache: 'no-store' })
        .then(async (response) => {
            if (response.status === 401 || response.status === 403) {   // not signed in, or not an admin
                location.replace(LOGIN_PAGE_URL);
                return;
            }
            const result = await response.json();
            if (result.ok) nameElement.textContent = result.name;
        })
        .catch(() => { /* leave the page as is */ });
})();
