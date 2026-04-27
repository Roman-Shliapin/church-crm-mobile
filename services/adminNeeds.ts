import { api } from "./api";
import { getToken } from "./auth";
import type { Need } from "./needs";

export type AdminNeed = Need & {
    userId?: string;
    archived?: boolean;
    phone?: string;
    doneAt?: string | null;
    doneMessage?: string | null;
};

export type NeedStatusAction = "in_progress" | "done";

async function requireToken(): Promise<string> {
    const token = await getToken();
    if (!token) {
        throw new Error("Не знайдено токен. Увійдіть знову.");
    }
    return token;
}

function parseNeedsList(data: unknown): AdminNeed[] {
    if (Array.isArray(data)) {
        return data as AdminNeed[];
    }
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.needs)) {
            return obj.needs as AdminNeed[];
        }
        if (Array.isArray(obj.items)) {
            return obj.items as AdminNeed[];
        }
        if (typeof obj.message === "string") {
            throw new Error(obj.message);
        }
    }
    return [];
}

/** Без параметра або `undefined` — усі активні; інакше `?category=…` */
export type AdminActiveCategory = "products" | "chemistry" | "other";

export async function getAdminActiveNeeds(category?: AdminActiveCategory): Promise<AdminNeed[]> {
    const token = await requireToken();
    const qs =
        category != null ? `?category=${encodeURIComponent(category)}` : "";
    const data = await api.get(`/admin/needs/active${qs}`, token);
    return parseNeedsList(data);
}

export async function getAdminArchivedNeeds(): Promise<AdminNeed[]> {
    const token = await requireToken();
    const data = await api.get("/admin/needs/archived", token);
    return parseNeedsList(data);
}

export async function updateAdminNeedStatus(
    needId: string,
    action: NeedStatusAction,
): Promise<unknown> {
    const token = await requireToken();
    const id = encodeURIComponent(needId);
    return api.patch(`/admin/needs/${id}/status`, { action }, token);
}

export async function replyToAdminNeed(
    needId: string,
    message: string,
): Promise<unknown> {
    const token = await requireToken();
    const id = encodeURIComponent(needId);
    return api.post(`/admin/needs/${id}/reply`, { message }, token);
}
