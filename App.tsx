import { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from './app/screens/LoginScreen'
import TabNavigator from './app/navigation/TabNavigator'

const Stack = createNativeStackNavigator()

export default function App() {
  const [user, setUser] = useState<{ token: string; role: string } | null>(null)

  return (
    <NavigationContainer>
      {user ? (
        <TabNavigator role={user.role} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={setUser} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}