import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "userId";

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem("token", token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const removeToken = async () => {
  await AsyncStorage.removeItem("token");
};

export const saveUserId = async (userId: string) => {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
};

export const getUserId = async () => {
  return await AsyncStorage.getItem(USER_ID_KEY);
};

export const removeUserId = async () => {
  await AsyncStorage.removeItem(USER_ID_KEY);
};
