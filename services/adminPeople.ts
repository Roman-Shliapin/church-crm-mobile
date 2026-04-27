import { api } from "./api";
import { getToken } from "./auth";

/** Поля з API members / candidates — підлаштуй під реальний JSON */
export type AdminPerson = {
    _id?: string;
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    birthday?: string;
    baptism?: string;
    baptized?: boolean;
    role?: string;
};

async function requireToken(): Promise<string> {
    const token = await getToken();
    if (!token) {
        throw new Error("Не знайдено токен. Увійдіть знову.");
    }
    return token;
}

function parsePeopleList(data: unknown, arrayKeys: string[]): AdminPerson[] {
    if (Array.isArray(data)) {
        return data as AdminPerson[];
    }
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        for (const key of arrayKeys) {
            if (Array.isArray(obj[key])) {
                return obj[key] as AdminPerson[];
            }
        }
        if (typeof obj.message === "string") {
            throw new Error(obj.message);
        }
    }
    return [];
}

export async function getAdminMembers(): Promise<AdminPerson[]> {
    const token = await requireToken();
    const data = await api.get("/admin/members", token);
    return parsePeopleList(data, ["members", "items", "data", "results"]);
}

export async function getAdminCandidates(): Promise<AdminPerson[]> {
    const token = await requireToken();
    const data = await api.get("/admin/candidates", token);
    return parsePeopleList(data, ["candidates", "items", "data", "results"]);
}

export function personId(p: AdminPerson): string {
    return p._id ?? p.id ?? "";
}
