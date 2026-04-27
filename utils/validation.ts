const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(raw: string): string {
    return raw.replace(/\s/g, '').trim();
}

export function isValidEmail(email: string): boolean {
    const t = email.trim().toLowerCase();
    return t.length > 3 && EMAIL_RE.test(t);
}

/** Повертає текст помилки українською або null, якщо все ок */
export function validateLoginForm(email: string, password: string): string | null {
    const e = email.trim();
    if (!e) return 'Введіть email';
    if (!isValidEmail(e)) return 'Некоректний формат email';
    if (!password) return 'Введіть пароль';
    if (password.length < 6) return 'Пароль має бути не коротший за 6 символів';
    return null;
}

export function validateRegisterForm(
    phone: string,
    email: string,
    password: string,
    password2: string,
): string | null {
    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) return 'Введіть номер телефону';
    if (phoneNorm.length < 10) return 'Перевірте номер телефону';
    const em = email.trim().toLowerCase();
    if (!em) return 'Введіть email';
    if (!isValidEmail(em)) return 'Некоректний формат email';
    if (!password) return 'Введіть пароль';
    if (password.length < 6) return 'Пароль має бути не коротший за 6 символів';
    if (password !== password2) return 'Паролі не збігаються';
    return null;
}
