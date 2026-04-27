import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import TabNavigator from './app/navigation/TabNavigator';
import type { AuthStackParamList } from './app/navigation/types';
import type { AppUser } from './app/types/auth';
import { AppErrorBoundary } from './app/components/AppErrorBoundary';
import {
  registerSignOutHandler,
  unregisterSignOutHandler,
  SessionExpiredError,
} from './services/session';
import { getToken } from './services/auth';
import { getProfile } from './services/profile';
import { nameFromToken, roleFromToken } from './services/jwt';
import { Colors } from './constants/colors';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    registerSignOutHandler(() => setUser(null));
    return () => unregisterSignOutHandler();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        try {
          const profile = await getProfile();
          if (cancelled) return;
          const name = typeof profile.name === 'string' ? profile.name.trim() : '';
          setUser({
            token,
            role: roleFromToken(token),
            name: name || nameFromToken(token),
          });
        } catch (e) {
          if (e instanceof SessionExpiredError) return;
          if (cancelled) return;
          setUser({
            token,
            role: roleFromToken(token),
            name: nameFromToken(token),
          });
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hydrating) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <AppErrorBoundary onReset={() => setNavKey((k) => k + 1)}>
      <NavigationContainer key={navKey}>
        {user ? (
          <TabNavigator role={user.role} userName={user.name} />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onLogin={setUser}
                  onGoRegister={() => navigation.navigate('Register')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {({ navigation }) => (
                <RegisterScreen
                  onRegistered={setUser}
                  onGoLogin={() => navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
