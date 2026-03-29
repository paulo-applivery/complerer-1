const BASE_URL = '/api';
function getUserId() {
    return localStorage.getItem('userId');
}
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
    };
    const userId = getUserId();
    if (userId) {
        headers['X-User-Id'] = userId;
    }
    return headers;
}
async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
export const api = {
    get(path) {
        return request(path, { method: 'GET' });
    },
    post(path, body) {
        return request(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
    patch(path, body) {
        return request(path, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
    put(path, body) {
        return request(path, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
    delete(path) {
        return request(path, { method: 'DELETE' });
    },
    upload(path, formData) {
        const url = `${BASE_URL}${path}`;
        const headers = {};
        const userId = getUserId();
        if (userId)
            headers['X-User-Id'] = userId;
        // Don't set Content-Type — browser sets it with boundary for multipart
        return fetch(url, { method: 'POST', headers, body: formData }).then(async (res) => {
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(error.message || `HTTP ${res.status}`);
            }
            return res.json();
        });
    },
};
//# sourceMappingURL=api.js.map