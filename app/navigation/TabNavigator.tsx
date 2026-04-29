import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import NeedsScreen from '../screens/NeedsScreen';
import NeedDetailScreen from '../screens/NeedDetailScreen';
import CreateNeedScreen from '../screens/CreateNeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../../constants/colors';
import { CustomTabBar } from '../components/CustomTabBar';
import { Home, FileText, User, BookOpen } from 'lucide-react-native';
import type { MainTabParamList, NeedsStackParamList } from './types';
import BibleScreenStack from '../screens/BibleScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
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

export type TabNavigatorProps = {
    userName?: string;
    currentUserId?: string;
    onOpenAdmin?: () => void;
};

export default function TabNavigator({
    userName,
    currentUserId,
    onOpenAdmin,
}: TabNavigatorProps) {
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
                        currentUserId={currentUserId}
                        onOpenAdmin={onOpenAdmin}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen
                name="Bible"
                options={{
                    tabBarLabel: 'Біблія',
                    tabBarIcon: ({ color, size, focused }) => (
                        <BookOpen
                            size={size ?? 24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 1.85}
                        />
                    ),
                }}
            >
                {() => <BibleScreenStack />}
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
        </Tab.Navigator>
    );
}
