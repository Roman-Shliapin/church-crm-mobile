/** Декодування Base64 (payload JWT — зазвичай ASCII JSON). */
function base64Decode(b64: string): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let out = '';
    const str = b64.replace(/[^A-Za-z0-9+/=]/g, '');
    for (let i = 0; i < str.length; i += 4) {
        const enc1 = chars.indexOf(str.charAt(i));
        const enc2 = chars.indexOf(str.charAt(i + 1));
        const enc3 = chars.indexOf(str.charAt(i + 2));
        const enc4 = chars.indexOf(str.charAt(i + 3));
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        out += String.fromCharCode(chr1);
        if (enc3 !== 64) out += String.fromCharCode(chr2);
        if (enc4 !== 64) out += String.fromCharCode(chr3);
    }
    return out;
}

function base64UrlToBase64(s: string): string {
    let r = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = r.length % 4;
    if (pad) r += '='.repeat(4 - pad);
    return r;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length < 2 || !parts[1]) return null;
        const json = base64Decode(base64UrlToBase64(parts[1]));
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function roleFromToken(token: string): string {
    const p = parseJwtPayload(token);
    const r = p?.role;
    return typeof r === 'string' && r ? r : 'user';
}

export function nameFromToken(token: string): string | undefined {
    const p = parseJwtPayload(token);
    const n = p?.name;
    if (typeof n === 'string') {
        const t = n.trim();
        return t || undefined;
    }
    return undefined;
}
