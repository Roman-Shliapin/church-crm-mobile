import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CirclePlus, Search, FileText, ChevronRight, Users } from 'lucide-react-native';
import type { AdminStackParamList } from '../navigation/types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { AppCard } from '../components/AppCard';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminHub'> & {
    userName?: string;
};

export default function AdminHubScreen({ navigation, userName }: Props) {
    const initial = userName?.trim()?.charAt(0)?.toUpperCase() || 'A';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.topRow}>
                <View style={styles.titleBlock}>
                    <Text style={styles.heroTitle}>Адмін</Text>
                    <Text style={styles.heroHint}>Оберіть розділ</Text>
                </View>
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarLetter}>{initial}</Text>
                    </View>
                    <View style={styles.onlineDot} />
                </View>
            </View>

            <Text style={[Typography.sectionLabel, styles.sectionGap]}>
                Швидкі дії
            </Text>
            <TouchableOpacity
                style={styles.quickRow}
                activeOpacity={0.65}
                onPress={() => navigation.navigate('AdminNeeds')}
            >
                <Text style={styles.quickLabel}>Нова заявка</Text>
                <CirclePlus size={22} color={Colors.textLight} strokeWidth={1.85} />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.quickRow}
                activeOpacity={0.65}
                onPress={() => navigation.navigate('AdminPeople')}
            >
                <Text style={styles.quickLabel}>Пошук людини</Text>
                <Search size={22} color={Colors.textLight} strokeWidth={1.85} />
            </TouchableOpacity>

            <Text style={[Typography.sectionLabel, styles.sectionMgmt]}>
                Менеджмент
            </Text>

            <AppCard onPress={() => navigation.navigate('AdminNeeds')} style={styles.mgmtCard}>
                <View style={styles.mgmtInner}>
                    <FileText size={24} color={Colors.textLight} strokeWidth={1.85} />
                    <View style={styles.mgmtTexts}>
                        <Text style={Typography.cardTitle}>Заявки</Text>
                        <Text style={Typography.cardSubtitle}>
                            Перегляд та обробка звернень
                        </Text>
                    </View>
                    <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                </View>
            </AppCard>

            <AppCard onPress={() => navigation.navigate('AdminPeople')} style={styles.mgmtCard}>
                <View style={styles.mgmtInner}>
                    <Users size={24} color={Colors.textLight} strokeWidth={1.85} />
                    <View style={styles.mgmtTexts}>
                        <Text style={Typography.cardTitle}>Люди</Text>
                        <Text style={Typography.cardSubtitle}>
                            Члени та кандидати
                        </Text>
                    </View>
                    <ChevronRight size={20} color={Colors.textLight} strokeWidth={2} />
                </View>
            </AppCard>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 28,
    },
    titleBlock: {
        flex: 1,
        paddingRight: 12,
    },
    heroTitle: {
        ...Typography.heroTitle,
    },
    heroHint: {
        marginTop: 6,
        ...Typography.headerSubtitle,
    },
    avatarWrap: {
        position: 'relative',
        marginTop: 4,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text,
    },
    onlineDot: {
        position: 'absolute',
        right: 0,
        bottom: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    sectionGap: {
        marginBottom: 10,
    },
    quickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    quickLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    sectionMgmt: {
        marginTop: 28,
        marginBottom: 12,
    },
    mgmtCard: {
        marginBottom: 12,
        padding: 18,
    },
    mgmtInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    mgmtTexts: {
        flex: 1,
        minWidth: 0,
    },
});
