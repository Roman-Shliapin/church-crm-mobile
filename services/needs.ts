import { api } from "./api";
import { getToken } from "./auth";

export type NeedType = "humanitarian" | "other";

export type Need = {
    _id?: string;
    id?: string;
    description: string;
    type: NeedType;
    status: string;
    date?: string;
    name?: string;
    replyMessage?: string;
};

/** Повна заявка з GET /needs/:id */
export type NeedDetail = Need & {
    userId?: number;
    archived?: boolean;
    createdAt?: string;
    repliedAt?: string | null;
    doneAt?: string | null;
    doneMessage?: string | null;
};

async function requireToken(): Promise<string> {
    const token = await getToken();
    if (!token) {
        throw new Error("Не знайдено токен. Увійдіть знову.");
    }
    return token;
}

export async function getMyNeeds(): Promise<Need[]> {
    const token = await requireToken();
    const data = await api.get("/needs", token);
    if (Array.isArray(data)) {
        return data as Need[];
    }
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.needs)) {
            return obj.needs as Need[];
        }
        if (Array.isArray(obj.items)) {
            return obj.items as Need[];
        }
        if (typeof obj.message === "string") {
            throw new Error(obj.message);
        }
    }
    return [];
}

export async function createNeed(payload: {
    description: string;
    type: NeedType;
}): Promise<unknown> {
    const token = await requireToken();
    return api.post("/needs", payload, token);
}

export async function getNeedById(id: string): Promise<NeedDetail> {
    const token = await requireToken();
    const encoded = encodeURIComponent(id);
    const data = await api.get(`/needs/${encoded}`, token);
    return data as NeedDetail;
}

export function needTypeLabel(type: NeedType): string {
    return type === "humanitarian" ? "Гуманітарна" : "Інша";
}

/** Підпис типу для екрана деталей */
export function needTypeDetailLabel(type: string): string {
    if (type === "humanitarian") return "Гуманітарна допомога";
    if (type === "other") return "Інше";
    return needTypeLabel(type as NeedType);
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Очікує",
    "в очікуванні": "В очікуванні",
    awaiting: "Очікує",
    waiting: "Очікує",
    new: "Нова",
    нова: "Нова",
    нове: "Нова",
    active: "Активна",
    open: "Відкрита",
    in_progress: "В роботі",
    done: "Виконано",
    виконано: "Виконано",
    cancelled: "Скасовано",
    closed: "Закрита",
};

export function needStatusLabel(status: string): string {
    const key = status?.toLowerCase?.() ?? "";
    return STATUS_LABELS[key] ?? status;
}

export function needId(item: Need): string {
    return item._id ?? item.id ?? "";
}
