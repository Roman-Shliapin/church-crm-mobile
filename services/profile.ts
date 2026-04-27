import { api } from "./api";
import { getToken } from "./auth";

export type UserProfile = {
  name: string;
  phone: string;
  birthday: string;
  baptism: string;
};

export async function getProfile(): Promise<UserProfile> {
  const token = await getToken();
  if (!token) {
    throw new Error("Не знайдено токен. Увійдіть знову.");
  }
  return api.get("/profile", token);
}
