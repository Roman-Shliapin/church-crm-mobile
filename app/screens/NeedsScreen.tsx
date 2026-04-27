import { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CirclePlus, ChevronRight, FolderOpen } from 'lucide-react-native';
import type { NeedsStackParamList } from '../navigation/types';
import { Need, getMyNeeds, needId, needStatusLabel, needTypeLabel } from '../../services/needs';
import { Colors } from '../../constants/colors';
import { softCardShadow } from '../../constants/shadows';
import { ScreenHeader } from '../components/ScreenHeader';
import { SessionExpiredError } from '../../services/session';

function statusPillStyle(status: string) {
    const s = status?.toLowerCase?.() ?? '';
    if (s === 'done' || s === 'closed') {
        return { bg: `${Colors.primary}22`, border: `${Colors.primary}55`, text: Colors.primary };
    }
    if (s === 'in_progress') {
        return {
            bg: `${Colors.statusProgress}22`,
            border: `${Colors.statusProgress}55`,
            text: Colors.statusProgress,
        };
    }
    return { bg: `${Colors.textLight}18`, border: Colors.border, text: Colors.textLight };
}

type NeedsListNavigation = NativeStackNavigationProp<NeedsStackParamList, 'NeedsList'>;

export default function NeedsScreen() {
    const navigation = useNavigation<NeedsListNavigation>();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const loadNeeds = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const list = await getMyNeeds();
            setNeeds(list);
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            const message =
                e instanceof Error ? e.message : 'Не вдалось завантажити заявки';
            if (!isRefresh) {
                Alert.alert('Помилка', message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNeeds(false);
        }, [loadNeeds]),
    );

    const listHeader = (
        <View style={styles.listHeaderWrap}>
            <TouchableOpacity
                style={styles.newNeedCta}
                onPress={() => navigation.navigate('CreateNeed')}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Подати нову заявку"
            >
                <View style={styles.newNeedCtaIcon}>
                    <CirclePlus size={24} color={Colors.primary} strokeWidth={1.9} />
                </View>
                <View style={styles.newNeedCtaTexts}>
                    <Text style={styles.newNeedCtaTitle}>Нова заявка</Text>
                    <Text style={styles.newNeedCtaSub}>Гуманітарна допомога або інший запит</Text>
                </View>
                <ChevronRight size={22} color={Colors.textLight} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.listSectionLabel}>Мої звернення</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Need }) => {
        const pill = statusPillStyle(item.status);
        const id = needId(item);
        return (
            <TouchableOpacity
                style={styles.needCardWrap}
                activeOpacity={0.88}
                disabled={!id}
                onPress={() => id && navigation.navigate('NeedDetail', { needId: id })}
                accessibilityRole="button"
                accessibilityLabel={`Заявка: ${item.description?.slice(0, 60) ?? ''}`}
            >
                <View style={styles.needCard}>
                    <View style={styles.needCardTop}>
                        <View style={[styles.typeBadge, item.type === 'humanitarian' && styles.typeBadgeHum]}>
                            <Text style={styles.typeBadgeText}>{needTypeLabel(item.type)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                            <Text style={[styles.statusBadgeText, { color: pill.text }]}>
                                {needStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.needDescription}>{item.description}</Text>
                    {item.replyMessage ? (
                        <View style={styles.replyBox}>
                            <Text style={styles.replyLabel}>Відповідь церкви</Text>
                            <Text style={styles.replyText}>{item.replyMessage}</Text>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && needs.length === 0) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Завантаження заявок…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                <ScreenHeader title="Мої звернення" />
                <FlatList
                    data={needs}
                    keyExtractor={(item) => needId(item) || item.description}
                    renderItem={renderItem}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadNeeds(true)}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <FolderOpen size={48} color={Colors.border} strokeWidth={1.5} />
                            <Text style={styles.emptyTitle}>Поки немає заявок</Text>
                            <Text style={styles.emptyHint}>
                                Натисніть «Нова заявка» вище — після надсилання з’явиться тут.
                            </Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: Colors.textLight,
    },
    listSectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    listHeaderWrap: {
        marginTop: 12,
    },
    newNeedCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 16,
        marginBottom: 20,
        gap: 12,
        ...softCardShadow,
    },
    newNeedCtaIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: `${Colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newNeedCtaTexts: {
        flex: 1,
    },
    newNeedCtaTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
    },
    newNeedCtaSub: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textLight,
    },
    needCardWrap: {
        marginBottom: 12,
    },
    needCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 16,
        ...softCardShadow,
    },
    needCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: `${Colors.textLight}20`,
    },
    typeBadgeHum: {
        backgroundColor: `${Colors.primary}18`,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    needDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
    },
    replyBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: `${Colors.primary}0d`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${Colors.primary}33`,
    },
    replyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    replyText: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 16,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textLight,
    },
    emptyHint: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textLight,
        textAlign: 'center',
    },
});
