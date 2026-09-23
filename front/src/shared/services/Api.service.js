import { getStoredToken } from "../utils/token";

const apiBase = import.meta.env.VITE_API_URL_BASE;

const token = getStoredToken();

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

async function request(method, url, body) {
    const response = await fetch(`${apiBase}/${url}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} sur ${url}`);
    }

    return response.json();
}

export const api = {
    get: (url) => request("GET", url),
    post: (url, body) => request("POST", url, body),
    put: (url, body) => request("PUT", url, body),
    delete: (url) => request("DELETE", url)
};
