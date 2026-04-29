/** Користувач після логіну / реєстрації / відновлення сесії */
export type AppUser = {
    token: string;
    role: string;
    name?: string;
    userId?: string;
};
