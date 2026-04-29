import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import AdminScreen from '../screens/AdminScreen';
import AdminNeedsScreen from '../screens/AdminNeedsScreen';
import AdminNeedDetailScreen from '../screens/AdminNeedDetailScreen';
import MembersScreen from '../screens/MembersScreen';
import CandidatesScreen from '../screens/CandidatesScreen';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
    role: string;
    userName?: string;
    currentUserId?: string;
};

const stackScreenOpts = {
    headerTintColor: Colors.primary,
    headerTitleStyle: {
        fontWeight: '600' as const,
        fontSize: 17,
        color: Colors.text,
    },
    headerStyle: {
        backgroundColor: Colors.background,
    },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: Colors.background },
    headerBackTitle: 'Назад',
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export default function RootNavigator({ role, userName, currentUserId }: Props) {
    return (
        <Stack.Navigator screenOptions={stackScreenOpts}>
            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
                {({ navigation }) => (
                    <TabNavigator
                        userName={userName}
                        currentUserId={currentUserId}
                        onOpenAdmin={
                            role === 'admin'
                                ? () => navigation.navigate('Admin')
                                : undefined
                        }
                    />
                )}
            </Stack.Screen>
            <Stack.Screen
                name="Admin"
                component={AdminScreen}
                options={{ title: 'Адмін панель' }}
            />
            <Stack.Screen
                name="AdminNeeds"
                component={AdminNeedsScreen}
                options={{ title: 'Заявки' }}
            />
            <Stack.Screen
                name="AdminNeedDetail"
                component={AdminNeedDetailScreen}
                options={{ title: 'Заявка' }}
            />
            <Stack.Screen
                name="Members"
                component={MembersScreen}
                options={{ title: 'Члени церкви' }}
            />
            <Stack.Screen
                name="Candidates"
                component={CandidatesScreen}
                options={{ title: 'Кандидати' }}
            />
        </Stack.Navigator>
    );
}
