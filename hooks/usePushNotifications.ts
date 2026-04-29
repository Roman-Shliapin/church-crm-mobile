import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from '../services/api';
import { getToken } from '../services/auth';

type Props = {
  enabled: boolean;
};

async function registerForPush(): Promise<void> {
  // Push токени видаються лише на реальних пристроях.
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '7e5c7562-1bab-4e30-af3a-db578b66df72',
  });
  const pushToken = tokenData.data;
  if (!pushToken) return;

  const jwtToken = await getToken();
  if (!jwtToken) return;

  await api.post('/profile/push-token', { token: pushToken }, jwtToken);
}

export const usePushNotifications = ({ enabled }: Props): void => {
  useEffect(() => {
    if (!enabled) return;

    registerForPush().catch(() => {
      // Нічого не робимо: пуш має деградувати тихо.
    });
  }, [enabled]);
};
