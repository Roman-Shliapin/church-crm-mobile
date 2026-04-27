import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeScreen from '../screens/HomeScreen'
import { Colors } from '../../constants/colors'
import { Text } from 'react-native'


const Tab = createBottomTabNavigator();

export default function TabNavigator({ role }: { role: string }) {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textLight,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopColor: Colors.border,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Головна',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
                }}
            />
            {role === 'admin' && (
                <Tab.Screen
                    name="Admin"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Адмін',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
                    }}
                />
            )}
        </Tab.Navigator>
    )
}