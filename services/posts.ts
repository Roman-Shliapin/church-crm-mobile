import { API_BASE_URL } from '../constants/config';
import { api } from './api';
import { getToken } from './auth';

export type Post = {
    _id: string;
    title: string;
    content: string;
    authorName: string;
    createdAt: string;
    pinned?: boolean;
    expiresAt?: string | null;
    reactions?: PostReaction[];
};

export type ReactionType =
    | 'pray'
    | 'heart'
    | 'thumbs_up'
    | 'peace'
    | 'star';

export type PostReaction = {
    userId: string;
    type: string;
};

function parsePosts(data: unknown): Post[] {
    if (Array.isArray(data)) return data as Post[];
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.posts)) return obj.posts as Post[];
        if (Array.isArray(obj.items)) return obj.items as Post[];
    }
    return [];
}

function parsePost(data: unknown): Post {
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (obj.post && typeof obj.post === 'object') {
            return obj.post as Post;
        }
    }
    return data as Post;
}

function sortPostsForFeed(list: Post[]): Post[] {
    return [...list].sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });
}

async function requireToken(): Promise<string> {
    const token = await getToken();
    if (!token) {
        throw new Error('Не знайдено токен. Увійдіть знову.');
    }
    return token;
}

export async function getPosts(): Promise<Post[]> {
    const token = await requireToken();
    const data = await api.get('/posts', token);
    return sortPostsForFeed(parsePosts(data));
}

export async function createPost(payload: {
    title: string;
    content: string;
    expireDays: number | null;
}): Promise<Post> {
    const token = await requireToken();
    const data = await api.post('/posts', payload, token);
    return parsePost(data);
}

export async function deletePost(postId: string): Promise<void> {
    const token = await requireToken();
    const encoded = encodeURIComponent(postId);
    const res = await fetch(`${API_BASE_URL}/posts/${encoded}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        let message = `Помилка ${res.status}`;
        try {
            const data = (await res.json()) as { message?: string };
            if (typeof data?.message === 'string') message = data.message;
        } catch {
            // ignore malformed body
        }
        throw new Error(message);
    }
}

export async function togglePinPost(postId: string): Promise<Post> {
    const token = await requireToken();
    const encoded = encodeURIComponent(postId);
    const data = await api.patch(`/posts/${encoded}/pin`, {}, token);
    return parsePost(data);
}

export async function reactToPost(
    postId: string,
    type: ReactionType,
): Promise<Post> {
    const token = await requireToken();
    const encoded = encodeURIComponent(postId);
    const data = await api.post(`/posts/${encoded}/react`, { type }, token);
    return parsePost(data);
}
