/**
 * Бекенд: https://github.com/Roman-Shliapin/church-crm-api
 *
 * Очікувані префікси в Express: `/api/auth`, `/api/profile`, `/api/needs`,
 * `/api/admin` (див. `app.use('/api/admin', adminRoutes)` — як у твоєму `app.js`).
 * Мобілка б’є в ті ж шляхи відносно `.../api`.
 *
 * `.env`: EXPO_PUBLIC_API_BASE_URL=http://ХОСТ:ПОРТ/api
 *
 * Якщо fetch кидає «Network request failed»:
 * — Після зміни `.env` перезапусти Metro з очищенням кешу: `npx expo start --clear`.
 * — Сервер має слухати `0.0.0.0`, не лише `127.0.0.1`.
 * — Телефон у тій самій Wi‑Fi: у `.env` — LAN IP комп’ютера (macOS: `ipconfig getifaddr en0`).
 * — iOS Simulator: можна `http://127.0.0.1:3000/api`.
 * — Android Emulator: `http://10.0.2.2:3000/api` (мапиться на localhost хоста).
 */
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const fallback = 'http://172.16.0.148:3000/api';

export const API_BASE_URL = (fromEnv || fallback).replace(/\/+$/, '');

if (__DEV__) {
    // Перевір у консолі Metro, який URL реально вбудований у бандл.
    console.log('[API_BASE_URL]', API_BASE_URL);
}
