import { removeToken } from './auth';

/** Кидається після 401 на захищених запитах (токен очищено, сесію скинуто). */
export class SessionExpiredError extends Error {
    constructor() {
        super('SESSION_EXPIRED');
        this.name = 'SessionExpiredError';
    }
}

let onSignedOut: (() => void) | undefined;

export function registerSignOutHandler(fn: () => void) {
    onSignedOut = fn;
}

export function unregisterSignOutHandler() {
    onSignedOut = undefined;
}

/** Видаляє токен і повідомляє App (наприклад, `setUser(null)`). */
export async function signOut() {
    await removeToken();
    onSignedOut?.();
}
