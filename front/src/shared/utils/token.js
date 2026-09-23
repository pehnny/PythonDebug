const TOKEN_KEY = "shop-token";

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function storeToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Lit le payload du JWT renvoyé par /api/login.
 * La signature est vérifiée par l'api, pas ici.
 */
export function readUserFromToken(token) {
    if (!token) {
        return null;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));

    if (payload.exp * 1000 < Date.now()) {
        clearStoredToken();

        return null;
    }

    return {
        userid: payload.userid,
        username: payload.username,
        roles: payload.roles,
        isAdmin: payload.roles.includes("ADMIN")
    };
}
