import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import NeedsScreen from '../screens/NeedsScreen';
import NeedDetailScreen from '../screens/NeedDetailScreen';
import CreateNeedScreen from '../screens/CreateNeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminHubScreen from '../screens/AdminHubScreen';
import AdminNeedsScreen from '../screens/AdminNeedsScreen';
import AdminNeedDetailScreen from '../screens/AdminNeedDetailScreen';
import AdminPeopleScreen from '../screens/AdminPeopleScreen';
import { Colors } from '../../constants/colors';
import { CustomTabBar } from '../components/CustomTabBar';
import { Home, FileText, User, Settings } from 'lucide-react-native';
import type {
    AdminStackParamList,
    MainTabParamList,
    NeedsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const NeedsStack = createNativeStackNavigator<NeedsStackParamList>();

function NeedsStackNavigator() {
    return (
        <NeedsStack.Navigator
            screenOptions={{
                headerTintColor: Colors.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 17,
                    color: Colors.text,
                },
                headerStyle: {
                    backgroundColor: Colors.background,
                },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <NeedsStack.Screen
                name="NeedsList"
                component={NeedsScreen}
                options={{ headerShown: false }}
            />
            <NeedsStack.Screen
                name="NeedDetail"
                component={NeedDetailScreen}
                options={{
                    title: 'Заявка',
                    headerBackTitle: 'Назад',
                }}
            />
            <NeedsStack.Screen
                name="CreateNeed"
                component={CreateNeedScreen}
                options={{
                    title: 'Нова заявка',
                    headerBackTitle: 'Назад',
                }}
            />
        </NeedsStack.Navigator>
    );
}

function AdminStackNavigator({ userName }: { userName?: string }) {
    return (
        <AdminStack.Navigator
            initialRouteName="AdminHub"
            screenOptions={{
                headerTintColor: Colors.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 17,
                    color: Colors.text,
                },
                headerStyle: {
                    backgroundColor: Colors.background,
                },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <AdminStack.Screen name="AdminHub" options={{ headerShown: false }}>
                {(props) => <AdminHubScreen {...props} userName={userName} />}
            </AdminStack.Screen>
            <AdminStack.Screen
                name="AdminNeeds"
                component={AdminNeedsScreen}
                options={{
                    title: 'Заявки',
                }}
            />
            <AdminStack.Screen
                name="AdminNeedDetail"
                component={AdminNeedDetailScreen}
                options={{
                    title: 'Заявка',
                    headerBackTitle: 'Назад',
                }}
            />
            <AdminStack.Screen
                name="AdminPeople"
                component={AdminPeopleScreen}
                options={{
                    title: 'Люди',
                }}
            />
        </AdminStack.Navigator>
    );
}

export default function TabNavigator({
    role,
    userName,
}: {
    role: string;
    userName?: string;
}) {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.tabInactive,
                tabBarHideOnKeyboard: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                    marginBottom: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 0,
                    minHeight: Platform.OS === 'ios' ? 52 : 58,
                    paddingTop: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                options={{
                    tabBarLabel: 'Головна',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Home
                            size={size ?? 24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 1.85}
                        />
                    ),
                }}
            >
                {() => (
                    <HomeScreen
                        userName={userName}
                        isAdmin={role === 'admin'}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen
                name="Needs"
                options={{
                    tabBarLabel: 'Заявки',
                    tabBarIcon: ({ color, size, focused }) => (
                        <FileText
                            size={size ?? 24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 1.85}
                        />
                    ),
                }}
            >
                {() => <NeedsStackNavigator />}
            </Tab.Screen>
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Профіль',
                    tabBarIcon: ({ color, size, focused }) => (
                        <User
                            size={size ?? 24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 1.85}
                        />
                    ),
                }}
            />
            {role === 'admin' && (
                <Tab.Screen
                    name="Admin"
                    options={{
                        tabBarLabel: 'Адмін',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Settings
                                size={size ?? 24}
                                color={color}
                                strokeWidth={focused ? 2.5 : 1.85}
                            />
                        ),
                    }}
                >
                    {() => <AdminStackNavigator userName={userName} />}
                </Tab.Screen>
            )}
        </Tab.Navigator>
    );
}
