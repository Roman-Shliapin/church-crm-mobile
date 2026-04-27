import { useEffect, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile, UserProfile } from '../../services/profile';
import { signOut, SessionExpiredError } from '../../services/session';
import { Colors } from '../../constants/colors';
import { softCardShadow } from '../../constants/shadows';
import { ScreenHeader } from '../components/ScreenHeader';

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getProfile();
                if (!cancelled) setProfile(data);
            } catch (error) {
                if (error instanceof SessionExpiredError) return;
                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Не вдалось завантажити профіль',
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.centered}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.hint}>Завантаження профілю…</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.centered}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorIcon}>!</Text>
                        <Text style={styles.error}>{error}</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const displayName = profile?.name?.trim() || 'Учасник';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScreenHeader title="Профіль" subtitle={displayName} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.avatarOuter}>
                        <View style={styles.avatarInner}>
                            <Text style={styles.avatarLetter}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.headerTitle}>Дані учасника</Text>
                    <Text style={styles.headerSubtitle}>{displayName}</Text>
                </View>

                <View style={styles.card}>
                    <FieldRow
                        label="Ім'я"
                        value={profile?.name}
                        isFirst
                    />
                    <FieldRow label="Телефон" value={profile?.phone} />
                    <FieldRow label="Дата народження" value={profile?.birthday} />
                    <FieldRow
                        label="Дата хрещення"
                        value={profile?.baptism}
                        isLast
                    />
                </View>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() =>
                        Alert.alert('Вийти', 'Закрити сесію на цьому пристрої?', [
                            { text: 'Скасувати', style: 'cancel' },
                            {
                                text: 'Вийти',
                                style: 'destructive',
                                onPress: () => {
                                    void signOut();
                                },
                            },
                        ])
                    }
                    activeOpacity={0.75}
                >
                    <Text style={styles.logoutText}>Вийти з акаунту</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function FieldRow({
    label,
    value,
    isFirst,
    isLast,
}: {
    label: string;
    value?: string;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    const display = value?.trim() ? value : '—';
    return (
        <View
            style={[
                styles.fieldRow,
                isFirst && styles.fieldRowFirst,
                isLast && styles.fieldRowLast,
            ]}
        >
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue} numberOfLines={3}>
                {display}
            </Text>
        </View>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingCard: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 36,
        paddingHorizontal: 40,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        ...softCardShadow,
    },
    errorCard: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 28,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        maxWidth: 320,
        ...softCardShadow,
    },
    errorIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: `${Colors.error}18`,
        color: Colors.error,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 44,
        marginBottom: 12,
    },
    hint: {
        marginTop: 16,
        fontSize: 15,
        color: Colors.textLight,
    },
    error: {
        color: Colors.error,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
    },
    header: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 28,
    },
    avatarOuter: {
        padding: 4,
        borderRadius: 52,
        backgroundColor: Colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        marginBottom: 16,
        ...softCardShadow,
    },
    avatarInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: `${Colors.primary}14`,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: 36,
        fontWeight: '700',
        color: Colors.primary,
    },
    headerTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...softCardShadow,
    },
    fieldRow: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    fieldRowFirst: {
        borderTopWidth: 0,
    },
    fieldRowLast: {
        paddingBottom: 18,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    fieldValue: {
        fontSize: 17,
        fontWeight: '500',
        color: Colors.text,
        lineHeight: 24,
    },
    logoutBtn: {
        marginTop: 28,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.error,
    },
});
