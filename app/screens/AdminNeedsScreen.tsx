import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    ScrollView,
    Linking,
    Animated,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { RouteProp } from '@react-navigation/native';
import {
    AdminNeed,
    type AdminActiveCategory,
    getAdminActiveNeeds,
    getAdminArchivedNeeds,
} from '../../services/adminNeeds';
import { needId, needStatusLabel } from '../../services/needs';
import { Colors } from '../../constants/colors';
import { SessionExpiredError } from '../../services/session';
import {
    Layers,
    Carrot,
    FlaskConical,
    MessageCircle,
    Archive,
    CircleCheck,
    Settings,
    CircleDot,
    Clock,
    Check,
    type LucideIcon,
} from 'lucide-react-native';

type FilterTab = 'all' | AdminActiveCategory | 'archived';

const TAB_CONFIG: {
    key: FilterTab;
    label: string;
    Icon: LucideIcon;
}[] = [
    { key: 'all', label: 'Всі', Icon: Layers },
    { key: 'products', label: 'Продукти', Icon: Carrot },
    { key: 'chemistry', label: 'Хімія', Icon: FlaskConical },
    { key: 'other', label: 'Інше', Icon: MessageCircle },
    { key: 'archived', label: 'Архів', Icon: Archive },
];

function categoryForActiveApi(tab: FilterTab): AdminActiveCategory | undefined {
    if (tab === 'all') return undefined;
    if (tab === 'archived') return undefined;
    return tab;
}

function formatDoneAt(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function statusBadgeColors(status: string) {
    const s = (status ?? '').trim().toLowerCase();
    if (s === 'виконано' || s === 'done' || s === 'closed') {
        return {
            bg: `${Colors.statusBadgeDone}22`,
            border: `${Colors.statusBadgeDone}66`,
            text: Colors.statusBadgeDone,
        };
    }
    if (
        s === 'в очікуванні' ||
        s === 'in_progress' ||
        s.includes('очікуван')
    ) {
        return {
            bg: `${Colors.statusBadgeWaiting}22`,
            border: `${Colors.statusBadgeWaiting}66`,
            text: Colors.statusBadgeWaiting,
        };
    }
    if (
        s === 'нова' ||
        s === 'нове' ||
        s === 'новая' ||
        s === 'new' ||
        s === 'active' ||
        s === 'open' ||
        s === 'pending' ||
        s === 'created' ||
        s === 'submitted'
    ) {
        return {
            bg: `${Colors.statusBadgeNew}22`,
            border: `${Colors.statusBadgeNew}66`,
            text: Colors.statusBadgeNew,
        };
    }
    return {
        bg: `${Colors.textLight}22`,
        border: Colors.border,
        text: Colors.textLight,
    };
}

function normalizeTel(raw: string): string | null {
    const t = raw.replace(/[^\d+]/g, '');
    return t.length > 0 ? t : null;
}

/** Локальний фільтр списку за полем status */
type StatusFilterKey = 'all' | 'new' | 'waiting';

function normalizeNeedStatus(raw: string | undefined): string {
    return (typeof raw === 'string' ? raw : '').trim().toLowerCase();
}

/** Якщо з API приходить інший ключ замість status — все одно фільтруємо коректно. */
function rawNeedStatus(item: AdminNeed): string | undefined {
    const r = item as Record<string, unknown>;
    const primary = item.status;
    if (typeof primary === 'string' && primary.trim() !== '') return primary;
    const alt = r.state ?? r.needStatus;
    return typeof alt === 'string' ? alt : undefined;
}

function isDoneNeedStatus(s: string): boolean {
    return s === 'виконано' || s === 'done' || s === 'closed';
}

function isWaitingNeedStatus(s: string): boolean {
    return (
        s === 'в очікуванні' ||
        s === 'in_progress' ||
        s.includes('очікуван')
    );
}

/** Має збігатися з «синім» бейджем у statusBadgeColors (крім done / waiting). */
function isNewNeedStatus(s: string): boolean {
    if (!s) return false;
    if (isDoneNeedStatus(s) || isWaitingNeedStatus(s)) return false;
    return (
        s === 'нова' ||
        s === 'нове' ||
        s === 'новая' ||
        s === 'new' ||
        s === 'active' ||
        s === 'open' ||
        s === 'pending' ||
        s === 'created' ||
        s === 'submitted'
    );
}

function matchesStatusFilter(item: AdminNeed, filter: StatusFilterKey): boolean {
    const s = normalizeNeedStatus(rawNeedStatus(item));
    switch (filter) {
        case 'all':
            return true;
        case 'new':
            return isNewNeedStatus(s);
        case 'waiting':
            return isWaitingNeedStatus(s);
        default:
            return true;
    }
}

function emptyMessage(tab: FilterTab): string {
    switch (tab) {
        case 'all':
            return 'Немає активних заявок';
        case 'products':
            return 'Немає заявок на продукти';
        case 'chemistry':
            return 'Немає заявок на хімію';
        case 'other':
            return 'Немає інших заявок';
        case 'archived':
            return 'Архів порожній';
        default:
            return 'Немає заявок';
    }
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'AdminNeeds'>;

const STATUS_FILTER_OPTIONS: {
    key: StatusFilterKey;
    label: string;
    Icon: LucideIcon;
}[] = [
    { key: 'all', label: 'Всі статуси', Icon: Layers },
    { key: 'new', label: 'Нові', Icon: CircleDot },
    { key: 'waiting', label: 'В очікуванні', Icon: Clock },
];

export default function AdminNeedsScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteProp<RootStackParamList, 'AdminNeeds'>>();
    const [categoryTab, setCategoryTab] = useState<FilterTab>('all');
    const [needs, setNeeds] = useState<AdminNeed[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tabCounts, setTabCounts] = useState<Partial<Record<FilterTab, number>>>(
        {},
    );
    const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const listOpacity = useRef(new Animated.Value(1)).current;

    const filteredNeeds = useMemo(
        () => needs.filter((item) => matchesStatusFilter(item, statusFilter)),
        [needs, statusFilter],
    );

    useFocusEffect(
        useCallback(() => {
            const ic = route.params?.initialCategory;
            if (ic === 'archived') setCategoryTab('archived');
            else if (ic === 'active') setCategoryTab('all');
        }, [route.params?.initialCategory]),
    );

    useLayoutEffect(() => {
        const filterActive = statusFilter !== 'all';
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[styles.headerFilterBtn, filterActive && styles.headerFilterBtnActive]}
                    onPress={() => setFilterModalVisible(true)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Фільтр за статусом"
                >
                    <Settings
                        size={20}
                        color={filterActive ? Colors.primary : Colors.textLight}
                        strokeWidth={2}
                    />
                    <Text
                        style={[
                            styles.headerFilterText,
                            filterActive && styles.headerFilterTextActive,
                        ]}
                    >
                        Фільтр
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, statusFilter]);

    const load = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) setRefreshing(true);
                else {
                    setLoading(true);
                    listOpacity.setValue(0);
                }
                let list: AdminNeed[];
                if (categoryTab === 'archived') {
                    list = await getAdminArchivedNeeds();
                } else {
                    list = await getAdminActiveNeeds(categoryForActiveApi(categoryTab));
                }
                setNeeds(list);
                setTabCounts((prev) => ({ ...prev, [categoryTab]: list.length }));
                if (!isRefresh) {
                    Animated.timing(listOpacity, {
                        toValue: 1,
                        duration: 220,
                        useNativeDriver: true,
                    }).start();
                }
            } catch (e) {
                if (e instanceof SessionExpiredError) return;
                const message =
                    e instanceof Error ? e.message : 'Не вдалось завантажити заявки';
                if (!isRefresh) Alert.alert('Помилка', message);
                if (!isRefresh) {
                    Animated.timing(listOpacity, {
                        toValue: 1,
                        duration: 220,
                        useNativeDriver: true,
                    }).start();
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [categoryTab, listOpacity],
    );

    useEffect(() => {
        load(false);
    }, [categoryTab, load]);

    const onPressPhone = (phone: string | undefined) => {
        const n = phone?.trim();
        if (!n) return;
        const tel = normalizeTel(n);
        if (!tel) return;
        const url = tel.startsWith('+') ? `tel:${tel}` : `tel:${tel}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Помилка', 'Не вдалось відкрити дзвінок');
        });
    };

    const switchingOverlay = loading && !refreshing;

    const renderTabs = () => (
        <View style={styles.categoryBarWrap}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
            >
                {TAB_CONFIG.map(({ key, label, Icon }) => {
                    const active = categoryTab === key;
                    const count = tabCounts[key];
                    const iconColor = active ? Colors.white : Colors.textLight;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.catChip, active && styles.catChipActive]}
                            onPress={() => setCategoryTab(key)}
                            activeOpacity={0.85}
                        >
                            <Icon size={16} color={iconColor} strokeWidth={2} />
                            <Text
                                style={[
                                    styles.catChipLabel,
                                    active && styles.catChipLabelActive,
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>
                            {typeof count === 'number' ? (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{count}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderItem = ({ item }: { item: AdminNeed }) => {
        const pill = statusBadgeColors(item.status);
        const id = item._id ?? item.id ?? needId(item);
        const phone = typeof item.phone === 'string' ? item.phone : undefined;
        const isArchiveCard =
            categoryTab === 'archived' || Boolean(item.archived);
        const doneLine = formatDoneAt(item.doneAt ?? null);

        return (
            <TouchableOpacity
                style={[styles.card, isArchiveCard && styles.cardArchive]}
                activeOpacity={0.88}
                disabled={!id}
                onPress={() =>
                    id ? navigation.navigate('AdminNeedDetail', { need: item }) : undefined
                }
                accessibilityRole="button"
            >
                <Text style={styles.name} numberOfLines={2}>
                    {(item.name ?? '').trim() || 'Без імені'}
                </Text>
                <Text style={styles.description} numberOfLines={3}>
                    {item.description?.trim() || '—'}
                </Text>
                <View style={styles.rowMeta}>
                    <View
                        style={[
                            styles.statusPill,
                            {
                                backgroundColor: pill.bg,
                                borderColor: pill.border,
                            },
                        ]}
                    >
                        <Text style={[styles.statusPillText, { color: pill.text }]}>
                            {needStatusLabel(item.status)}
                        </Text>
                    </View>
                    {item.date ? (
                        <Text style={styles.date} numberOfLines={1}>
                            {item.date}
                        </Text>
                    ) : null}
                </View>
                {isArchiveCard && doneLine ? (
                    <View style={styles.doneRow}>
                        <CircleCheck
                            size={15}
                            color={Colors.statusBadgeDone}
                            strokeWidth={2}
                        />
                        <Text style={styles.doneRowText}>Виконано: {doneLine}</Text>
                    </View>
                ) : null}
                {isArchiveCard && item.doneMessage ? (
                    <Text style={styles.doneMessage}>{item.doneMessage}</Text>
                ) : null}
                {phone ? (
                    <TouchableOpacity
                        onPress={() => onPressPhone(phone)}
                        activeOpacity={0.7}
                        style={styles.phoneRow}
                    >
                        <Text style={styles.phoneLink}>{phone}</Text>
                        <Text style={styles.phoneHint}> Натисніть, щоб зателефонувати</Text>
                    </TouchableOpacity>
                ) : null}
            </TouchableOpacity>
        );
    };

    const EmptyIcon =
        categoryTab === 'archived' ? Archive : TAB_CONFIG.find((t) => t.key === categoryTab)?.Icon ?? Layers;

    const emptySubtitle =
        !switchingOverlay && needs.length > 0 && filteredNeeds.length === 0
            ? 'Немає заявок з обраним статусом'
            : emptyMessage(categoryTab);

    const selectStatusFilter = (key: StatusFilterKey) => {
        setStatusFilter(key);
        setFilterModalVisible(false);
    };

    const resetStatusFilter = () => {
        setStatusFilter('all');
        setFilterModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            {renderTabs()}
            <View style={styles.listWrap}>
                {switchingOverlay ? (
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : null}
                <Animated.View style={[styles.listAnimated, { opacity: listOpacity }]}>
                    <FlatList
                        data={filteredNeeds}
                        keyExtractor={(item) =>
                            String(item._id ?? item.id ?? needId(item) ?? item.description)
                        }
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
                            switchingOverlay ? null : (
                                <View style={styles.empty}>
                                    <EmptyIcon
                                        size={44}
                                        color={Colors.textLight}
                                        strokeWidth={1.4}
                                    />
                                    <Text style={styles.emptyText}>{emptySubtitle}</Text>
                                </View>
                            )
                        }
                    />
                </Animated.View>
            </View>

            <Modal
                visible={filterModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.filterModalOverlay}>
                    <TouchableOpacity
                        style={styles.filterModalBackdrop}
                        activeOpacity={1}
                        onPress={() => setFilterModalVisible(false)}
                    />
                    <View style={styles.filterModalCard}>
                        <Text style={styles.filterModalTitle}>Статус заявки</Text>
                        {STATUS_FILTER_OPTIONS.map(({ key, label, Icon }) => {
                            const selected = statusFilter === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.filterModalRow,
                                        selected && styles.filterModalRowSelected,
                                    ]}
                                    onPress={() => selectStatusFilter(key)}
                                    activeOpacity={0.85}
                                >
                                    <Icon
                                        size={20}
                                        color={selected ? Colors.primary : Colors.textLight}
                                        strokeWidth={2}
                                    />
                                    <Text
                                        style={[
                                            styles.filterModalRowText,
                                            selected && styles.filterModalRowTextSelected,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                    {selected ? (
                                        <Check size={20} color={Colors.primary} strokeWidth={2} />
                                    ) : (
                                        <View style={styles.filterModalCheckPlaceholder} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={styles.filterModalReset}
                            onPress={resetStatusFilter}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.filterModalResetText}>Скинути</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    headerFilterBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: `${Colors.primary}14`,
    },
    headerFilterText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textLight,
    },
    headerFilterTextActive: {
        color: Colors.primary,
    },
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    categoryBarWrap: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        marginRight: 8,
        gap: 6,
    },
    catChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    catChipLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
        maxWidth: 120,
    },
    catChipLabelActive: {
        color: Colors.white,
    },
    countBadge: {
        minWidth: 22,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.white,
    },
    listWrap: {
        flex: 1,
        position: 'relative',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `${Colors.background}E6`,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    listAnimated: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 28,
        flexGrow: 1,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 14,
        marginBottom: 10,
    },
    cardArchive: {
        backgroundColor: Colors.inputBg,
    },
    name: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 6,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
        marginBottom: 10,
    },
    rowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '800',
    },
    date: {
        fontSize: 13,
        color: Colors.textLight,
        flexShrink: 1,
    },
    doneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    doneRowText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
    },
    doneMessage: {
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textLight,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    phoneRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    phoneLink: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
        textDecorationLine: 'underline',
    },
    phoneHint: {
        fontSize: 12,
        color: Colors.textLight,
    },
    empty: {
        paddingVertical: 48,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.textLight,
        fontWeight: '600',
        textAlign: 'center',
    },
    filterModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    filterModalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    filterModalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        paddingVertical: 8,
        paddingHorizontal: 12,
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    filterModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        marginBottom: 4,
    },
    filterModalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    filterModalRowSelected: {
        backgroundColor: `${Colors.primary}12`,
    },
    filterModalRowText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    filterModalRowTextSelected: {
        color: Colors.primary,
    },
    filterModalCheckPlaceholder: {
        width: 20,
        height: 20,
    },
    filterModalReset: {
        marginTop: 8,
        paddingVertical: 14,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    filterModalResetText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
});
