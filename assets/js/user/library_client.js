window.TLCLibrary = (function () {
    const LIBRARY_API_URL = 'library_api.php';   

    const COVER_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">' +
        '<rect width="300" height="400" fill="#3E2C1B"/>' +
        '<text x="150" y="210" font-size="22" text-anchor="middle" fill="#d9c8b8" font-family="sans-serif">No cover</text></svg>'
    );

    /** GET: pass an object of query params. POST: pass the body object. */
    async function callLibraryApi(httpMethod, queryOrBody) {
        const requestOptions = {
            method: httpMethod,
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        };
        let requestUrl = LIBRARY_API_URL;
        if (httpMethod === 'GET') {
            requestUrl += '?' + new URLSearchParams(queryOrBody || {});
        } else {
            requestOptions.body = JSON.stringify(queryOrBody || {});
        }

        const response = await fetch(requestUrl, requestOptions);
        let result;
        try {
            result = await response.json();
        } catch {
            const apiError = new Error('The server returned an invalid response (HTTP ' + response.status + ').');
            apiError.httpStatus = response.status;
            throw apiError;
        }
        if (!result.ok) {
            const errors = Array.isArray(result.errors) ? result.errors : [result.error || 'Unknown error.'];
            const apiError = new Error(errors.join('\n'));
            apiError.httpStatus = response.status;
            throw apiError;
        }
        return result;
    }

    // "2026-11-08" or "2026-11-08 10:37:02" -> "Nov 8, 2026"
    function formatDate(dateText) {
        if (!dateText) return '—';
        const [year, month, day] = dateText.split(' ')[0].split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }

    // cover_image is stored as "assets/imgs/books/xxx.jpg"; the student pages live one folder deeper.
    function coverUrl(coverImagePath) {
        return coverImagePath ? '../' + coverImagePath : COVER_PLACEHOLDER;
    }

    return { callLibraryApi, formatDate, coverUrl };
})();
