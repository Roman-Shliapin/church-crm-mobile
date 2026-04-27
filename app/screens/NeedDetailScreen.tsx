import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NeedsStackParamList } from '../navigation/types';
import {
    getNeedById,
    needStatusLabel,
    needTypeDetailLabel,
    type NeedDetail,
} from '../../services/needs';
import { Colors } from '../../constants/colors';
import { softCardShadow } from '../../constants/shadows';
import { SessionExpiredError } from '../../services/session';

type Props = NativeStackScreenProps<NeedsStackParamList, 'NeedDetail'>;

function formatDateTime(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return null;
    }
}

/** Бейдж статусу: нова — синій, в очікуванні — жовто-гарячий, виконано — зелений */
function statusBadgeStyle(status: string) {
    const s = status?.toLowerCase?.() ?? '';
    if (s === 'виконано' || s === 'done' || s === 'closed') {
        return {
            bg: '#DCFCE7',
            border: '#86EFAC',
            text: '#15803D',
        };
    }
    if (s === 'в очікуванні' || s === 'in_progress' || s === 'awaiting' || s === 'waiting') {
        return {
            bg: '#FFEDD5',
            border: '#FDBA74',
            text: '#C2410C',
        };
    }
    if (s === 'нова' || s === 'new' || s === 'pending' || s === 'active' || s === 'open') {
        return {
            bg: '#DBEAFE',
            border: '#93C5FD',
            text: '#1D4ED8',
        };
    }
    return {
        bg: `${Colors.textLight}18`,
        border: Colors.border,
        text: Colors.text,
    };
}

export default function NeedDetailScreen({ route }: Props) {
    const { needId } = route.params;
    const [need, setNeed] = useState<NeedDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getNeedById(needId);
            setNeed(data);
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            setError(e instanceof Error ? e.message : 'Не вдалось завантажити заявку');
            setNeed(null);
        } finally {
            setLoading(false);
        }
    }, [needId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Завантаження…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !need) {
        return (
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error || 'Заявку не знайдено'}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
                        <Text style={styles.retryBtnText}>Спробувати знову</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const badge = statusBadgeStyle(need.status);
    const typeStr = typeof need.type === 'string' ? need.type : 'other';
    const replyDate = formatDateTime(need.repliedAt ?? undefined);
    const doneDate = formatDateTime(need.doneAt ?? undefined);
    const showReply = Boolean(need.replyMessage?.trim());
    const showDone = Boolean(need.doneMessage?.trim());

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {needStatusLabel(need.status)}
                    </Text>
                </View>

                <Text style={styles.description}>{need.description}</Text>

                <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Тип</Text>
                    <Text style={styles.metaValue}>{needTypeDetailLabel(typeStr)}</Text>
                </View>

                {need.date ? (
                    <View style={styles.metaBlock}>
                        <Text style={styles.metaLabel}>Дата подачі</Text>
                        <Text style={styles.metaValue}>{need.date}</Text>
                    </View>
                ) : null}

                {showReply ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Відповідь служителя</Text>
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionBody}>{need.replyMessage}</Text>
                            {replyDate ? (
                                <Text style={styles.sectionDate}>{replyDate}</Text>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                {showDone ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Виконано</Text>
                        <View style={[styles.sectionCard, styles.sectionCardDone]}>
                            <Text style={styles.sectionBody}>{need.doneMessage}</Text>
                            {doneDate ? (
                                <Text style={styles.sectionDate}>{doneDate}</Text>
                            ) : null}
                        </View>
                    </View>
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
        paddingTop: 16,
        paddingBottom: 32,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: Colors.textLight,
    },
    errorText: {
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    retryBtnText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 20,
    },
    statusBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    description: {
        fontSize: 17,
        lineHeight: 26,
        color: Colors.text,
        marginBottom: 24,
    },
    metaBlock: {
        marginBottom: 16,
    },
    metaLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    metaValue: {
        fontSize: 16,
        color: Colors.text,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 16,
        ...softCardShadow,
    },
    sectionCardDone: {
        borderColor: `${Colors.primary}44`,
    },
    sectionBody: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
    },
    sectionDate: {
        marginTop: 12,
        fontSize: 13,
        color: Colors.textLight,
    },
});
