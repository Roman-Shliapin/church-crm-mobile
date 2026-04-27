import { API_BASE_URL } from "../constants/config";
import { signOut, SessionExpiredError } from "./session";

async function readBody(res: Response): Promise<any> {
    const text = await res.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
}

/** 401 лише для запитів із токеном (не логін / реєстрація). */
async function ensureAuthorizedOrThrow(
    res: Response,
    hadAuthHeader: boolean,
): Promise<void> {
    if (res.status !== 401 || !hadAuthHeader) return;
    await signOut();
    throw new SessionExpiredError();
}

function messageFromErrorBody(data: unknown, status: number): string {
    if (data && typeof data === "object" && typeof (data as { message?: string }).message === "string") {
        return (data as { message: string }).message;
    }
    return `Помилка ${status}`;
}

/** Для захищених запитів — кидає Error, якщо статус не 2xx (крім 401 → SessionExpiredError вище). */
function throwIfAuthRequestFailed(res: Response, data: unknown): void {
    if (res.ok) return;
    throw new Error(messageFromErrorBody(data, res.status));
}

export const api = {
    post: async (path: string, body: object, token?: string) => {
        const hadAuth = Boolean(token);
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await readBody(res);
        await ensureAuthorizedOrThrow(res, hadAuth);
        if (hadAuth) throwIfAuthRequestFailed(res, data);
        return data;
    },
    get: async (path: string, token: string) => {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await readBody(res);
        await ensureAuthorizedOrThrow(res, true);
        throwIfAuthRequestFailed(res, data);
        return data;
    },
    patch: async (path: string, body: object, token: string) => {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await readBody(res);
        await ensureAuthorizedOrThrow(res, true);
        throwIfAuthRequestFailed(res, data);
        return data;
    },
};
