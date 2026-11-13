const DASHBOARD_API_URL = 'admin_api.php?action=dashboard';

function formatDate(dateText) {
    if (!dateText) return '—';
    const [year, month, day] = dateText.split(' ')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function createStatCard(value, label, note, isAlert) {
    const cardElement = document.createElement('div');
    cardElement.className = 'stat_card' + (isAlert ? ' stat_alert' : '');
    const valueElement = document.createElement('span');
    valueElement.className = 'stat_value';
    valueElement.textContent = value;
    const labelElement = document.createElement('span');
    labelElement.className = 'stat_label';
    labelElement.textContent = label;
    cardElement.append(valueElement, labelElement);
    if (note) {
        const noteElement = document.createElement('span');
        noteElement.className = 'stat_note';
        noteElement.textContent = note;
        cardElement.appendChild(noteElement);
    }
    return cardElement;
}

function fillTable(tableBodyId, rows, columnCount, emptyText, getCells) {
    const tableBody = document.getElementById(tableBodyId);
    if (!rows.length) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = columnCount;
        emptyCell.className = 'message_cell';
        emptyCell.textContent = emptyText;
        emptyRow.appendChild(emptyCell);
        tableBody.replaceChildren(emptyRow);
        return;
    }
    tableBody.replaceChildren(...rows.map((row) => {
        const rowElement = document.createElement('tr');
        getCells(row).forEach((cellText) => {
            const cellElement = document.createElement('td');
            cellElement.textContent = cellText;   // textContent keeps names/titles safe
            rowElement.appendChild(cellElement);
        });
        return rowElement;
    }));
}

async function loadDashboard() {
    const messageElement = document.getElementById('dashboard_message');
    messageElement.textContent = 'Loading...';
    try {
        const response = await fetch(DASHBOARD_API_URL, { credentials: 'same-origin', cache: 'no-store' });
        const result = await response.json();
        if (!result.ok) throw new Error((result.errors || ['Unknown error.']).join('\n'));
        messageElement.textContent = '';

        const stats = result.stats;
        document.getElementById('stat_grid').replaceChildren(
            createStatCard(stats.total_users, 'Total users', stats.total_students + ' students'),
            createStatCard(stats.total_titles, 'Total books', stats.total_copies + ' copies in all'),
            createStatCard(stats.available_copies, 'Available books', stats.available_titles + ' of ' + stats.total_titles + ' titles on the shelf'),
            createStatCard(stats.overdue_count, 'Overdue', 'borrowers past due date', stats.overdue_count > 0),
            createStatCard(stats.pickup_count, 'Awaiting pickup', 'reserved, not yet collected'),
            createStatCard(stats.waitlist_count, 'On waitlists', 'students waiting for a copy')
        );

        fillTable('overdue_body', result.overdue, 5, 'No overdue books.', (row) => [
            row.borrower_name, row.borrower_email, row.book_title, formatDate(row.due_date), row.days_overdue + ' day(s)'
        ]);
        fillTable('pickup_body', result.pending_pickups, 4, 'No reservations waiting for pickup.', (row) => [
            row.borrower_name, row.book_title, formatDate(row.reserved_at), formatDate(row.pickup_deadline)
        ]);
        fillTable('waitlist_body', result.waitlist, 4, 'Nobody is on a waitlist.', (row) => [
            row.student_name, row.book_title, '#' + row.position, formatDate(row.joined_at)
        ]);
    } catch (error) {
        messageElement.textContent = 'Could not load the dashboard: ' + error.message;
    }
}

loadDashboard();
