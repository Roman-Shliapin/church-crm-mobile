import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { UserCircle, Users } from 'lucide-react-native';
import {
    AdminPerson,
    getAdminCandidates,
    getAdminMembers,
    personId,
} from '../../services/adminPeople';
import { Colors } from '../../constants/colors';
import { softCardShadow } from '../../constants/shadows';
import { SessionExpiredError } from '../../services/session';
import { getFirstName } from '../../services/nameUtils';

type PeopleTab = 'members' | 'candidates';

type AdminPeoplePanelProps = {
    initialSubTab?: PeopleTab;
    /** Якщо true — тільки один список без перемикача табів */
    hideTabs?: boolean;
};

function Row({ label, value }: { label: string; value?: string }) {
    const v = value?.trim();
    if (!v) return null;
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{v}</Text>
        </View>
    );
}

export default function AdminPeoplePanel({
    initialSubTab = 'members',
    hideTabs = false,
}: AdminPeoplePanelProps) {
    const [subTab, setSubTab] = useState<PeopleTab>(initialSubTab);
    const [people, setPeople] = useState<AdminPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) setRefreshing(true);
                else setLoading(true);
                const list =
                    subTab === 'members'
                        ? await getAdminMembers()
                        : await getAdminCandidates();
                setPeople(list);
            } catch (e) {
                if (e instanceof SessionExpiredError) return;
                const message =
                    e instanceof Error ? e.message : 'Не вдалось завантажити список';
                if (!isRefresh) Alert.alert('Помилка', message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [subTab],
    );

    useEffect(() => {
        setSubTab(initialSubTab);
    }, [initialSubTab]);

    useEffect(() => {
        load(false);
    }, [subTab, load]);

    const renderItem = ({ item }: { item: AdminPerson }) => {
        const title = getFirstName(item.name ?? '') || 'Без імені';
        const baptized =
            item.baptized === true
                ? 'Хрещений'
                : item.baptized === false
                  ? 'Не хрещений'
                  : undefined;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <UserCircle size={22} color={Colors.primary} strokeWidth={1.85} />
                    <Text style={styles.cardName} numberOfLines={2}>
                        {title}
                    </Text>
                </View>
                {item.role ? (
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{item.role}</Text>
                    </View>
                ) : null}
                <Row label="Телефон" value={item.phone} />
                <Row label="Email" value={item.email} />
                <Row label="Дата народження" value={item.birthday} />
                <Row label="Дата хрещення" value={item.baptism} />
                <Row label="Статус" value={baptized} />
            </View>
        );
    };

    if (loading && people.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Завантаження…</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {hideTabs ? null : (
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, subTab === 'members' && styles.tabActive]}
                        onPress={() => setSubTab('members')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabLabel, subTab === 'members' && styles.tabLabelActive]}>
                            Члени
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, subTab === 'candidates' && styles.tabActive]}
                        onPress={() => setSubTab('candidates')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[styles.tabLabel, subTab === 'candidates' && styles.tabLabelActive]}
                        >
                            Кандидати
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={people}
                keyExtractor={(item) => personId(item) || item.email || item.phone || item.name || '?'}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => load(true)}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Users size={44} color={Colors.border} strokeWidth={1.4} />
                        <Text style={styles.emptyTitle}>Список порожній</Text>
                        <Text style={styles.emptyHint}>
                            {subTab === 'members'
                                ? 'Члени з’являться тут після додавання в базу.'
                                : 'Кандидати з’являться тут.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: Colors.textLight,
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 4,
        marginBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textLight,
    },
    tabLabelActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 16,
        marginBottom: 10,
        ...softCardShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    cardName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: `${Colors.primary}18`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${Colors.primary}44`,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    row: {
        marginTop: 8,
    },
    rowLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    rowValue: {
        fontSize: 15,
        color: Colors.text,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 16,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textLight,
    },
    emptyHint: {
        marginTop: 6,
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
    },
});
