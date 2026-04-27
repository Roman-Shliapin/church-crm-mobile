import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { User, ChevronRight, FileText, Settings } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { softCardShadow } from '../../constants/shadows';
import { AppCard } from '../components/AppCard';
import type { MainTabParamList } from '../navigation/types';

type HomeNavigation = BottomTabNavigationProp<MainTabParamList, 'Home'>;

type HomeScreenProps = {
    userName?: string;
    isAdmin?: boolean;
};

export default function HomeScreen({ userName, isAdmin }: HomeScreenProps) {
    const navigation = useNavigation<HomeNavigation>();
    const greetingName = userName?.trim() || '';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.hero}>
                    <Text style={styles.churchLine}>Церква Христова</Text>
                    <Text style={styles.cityLine}>м. Вінниця</Text>
                    <Text style={styles.welcome}>
                        {greetingName ? `Вітаємо, ${greetingName}!` : 'Вітаємо!'}
                    </Text>
                    <Text style={styles.welcomeHint}>
                        Швидкий доступ до розділів додатку.
                    </Text>
                </View>

                <Text style={[Typography.sectionLabel, styles.section]}>Розділи</Text>

                <AppCard
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.linkCard}
                >
                    <View style={styles.linkRow}>
                        <User size={24} color={Colors.textLight} strokeWidth={1.85} />
                        <View style={styles.linkBody}>
                            <Text style={Typography.cardTitle}>Профіль</Text>
                            <Text style={Typography.cardSubtitle}>
                                Ім’я, контакти, дати хрещення та народження
                            </Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                    </View>
                </AppCard>

                <AppCard
                    onPress={() => navigation.navigate('Needs')}
                    style={styles.linkCard}
                >
                    <View style={styles.linkRow}>
                        <FileText size={24} color={Colors.textLight} strokeWidth={1.85} />
                        <View style={styles.linkBody}>
                            <Text style={Typography.cardTitle}>Мої заявки</Text>
                            <Text style={Typography.cardSubtitle}>
                                Перегляд статусу та створення нової заявки
                            </Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                    </View>
                </AppCard>

                {isAdmin ? (
                    <AppCard
                        onPress={() =>
                            navigation.navigate('Admin', { screen: 'AdminNeeds' })
                        }
                        style={styles.linkCard}
                    >
                        <View style={styles.linkRow}>
                            <Settings size={24} color={Colors.textLight} strokeWidth={1.85} />
                            <View style={styles.linkBody}>
                                <Text style={Typography.cardTitle}>
                                    Адміністрування
                                </Text>
                                <Text style={Typography.cardSubtitle}>
                                    Заявки, члени та кандидати
                                </Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                        </View>
                    </AppCard>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    hero: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 22,
        marginTop: 4,
        marginBottom: 28,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        ...softCardShadow,
    },
    churchLine: {
        ...Typography.sectionLabel,
        color: Colors.accent,
        letterSpacing: 1.4,
    },
    cityLine: {
        marginTop: 6,
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textLight,
    },
    welcome: {
        marginTop: 18,
        ...Typography.heroTitle,
        fontSize: 26,
    },
    welcomeHint: {
        marginTop: 10,
        ...Typography.muted,
    },
    section: {
        marginBottom: 12,
    },
    linkCard: {
        marginBottom: 12,
        padding: 18,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    linkBody: {
        flex: 1,
        minWidth: 0,
    },
});
