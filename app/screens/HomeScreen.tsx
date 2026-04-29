import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Settings } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { softCardShadow } from '../../constants/shadows';
import { getFirstName } from '../../services/nameUtils';
import {
    getPosts,
    reactToPost,
    type Post,
    type ReactionType,
} from '../../services/posts';
import { SessionExpiredError } from '../../services/session';

type HomeScreenProps = {
    userName?: string;
    currentUserId?: string;
    onOpenAdmin?: () => void;
};

const REACTION_ORDER: ReactionType[] = [
    'pray',
    'heart',
    'thumbs_up',
    'peace',
    'star',
];

function reactionMatches(rType: string, filter: ReactionType): boolean {
    if (rType === filter) return true;
    if (filter === 'peace' && rType === 'dove') return true;
    return false;
}

export default function HomeScreen({ userName, currentUserId, onOpenAdmin }: HomeScreenProps) {
    const greetingName = userName ? getFirstName(userName) : '';
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [reactingKey, setReactingKey] = useState<string | null>(null);

    const loadPosts = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            const list = await getPosts();
            setPosts(list);
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            setPosts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPosts(false);
    }, [loadPosts]);

    const listHeader = useMemo(
        () => (
            <View>
                {onOpenAdmin ? (
                    <View style={styles.topBar}>
                        <View style={styles.topBarSpacer} />
                        <TouchableOpacity
                            style={styles.adminEntry}
                            onPress={onOpenAdmin}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel="Адмін панель"
                        >
                            <Settings
                                size={22}
                                color={Colors.primary}
                                strokeWidth={2}
                            />
                            <Text style={styles.adminEntryText}>Адмін панель</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <View style={styles.hero}>
                    <Text style={styles.churchLine}>ЦЕРКВА ХРИСТОВА / м. Вінниця</Text>
                    <Text style={styles.welcome}>
                        {greetingName ? `Вітаємо, ${greetingName}!` : 'Вітаємо!'}
                    </Text>
                </View>

                <Text style={[Typography.sectionLabel, styles.newsSectionLabel]}>
                    Оголошення
                </Text>
            </View>
        ),
        [greetingName, onOpenAdmin],
    );

    const renderPost = ({ item }: { item: Post }) => {
        const author = getFirstName(item.authorName ?? '') || 'Автор';
        const content = item.content?.trim() || '...';
        const showReadMore = content.length > 140;
        const reactions = Array.isArray(item.reactions) ? item.reactions : [];
        const date = new Date(item.createdAt);
        const dateText = Number.isNaN(date.getTime())
            ? item.createdAt
            : date.toLocaleString('uk-UA', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
              });

        return (
            <TouchableOpacity
                style={styles.postCard}
                activeOpacity={0.9}
                onPress={() => setSelectedPost(item)}
            >
                <Text style={styles.postTitle}>{item.title?.trim() || 'Без заголовка'}</Text>
                <Text style={styles.postContent} numberOfLines={4}>
                    {content}
                </Text>
                {showReadMore ? (
                    <TouchableOpacity
                        onPress={() => setSelectedPost(item)}
                        style={styles.readMoreBtn}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.readMore}>Читати далі...</Text>
                    </TouchableOpacity>
                ) : null}
                <View style={styles.postMetaRow}>
                    <Text style={styles.postMeta}>{author}</Text>
                    <Text style={styles.postMeta}>{dateText}</Text>
                </View>
                <View style={styles.reactionsRow}>
                    {REACTION_ORDER.map((type) => {
                        const count = reactions.filter((r) =>
                            reactionMatches(r.type, type),
                        ).length;
                        const active = Boolean(
                            currentUserId &&
                                reactions.some(
                                    (r) =>
                                        reactionMatches(r.type, type) &&
                                        r.userId === currentUserId,
                                ),
                        );
                        const key = `${item._id}:${type}`;
                        const busy = reactingKey === key;
                        const iconColor = active ? Colors.primary : Colors.textLight;

                        const onPressReaction = async () => {
                            if (busy) return;
                            try {
                                setReactingKey(key);
                                const updated = await reactToPost(item._id, type);
                                setPosts((prev) =>
                                    prev.map((p) => (p._id === updated._id ? updated : p)),
                                );
                                setSelectedPost((prev) =>
                                    prev?._id === updated._id ? updated : prev,
                                );
                            } catch (e) {
                                if (e instanceof SessionExpiredError) return;
                            } finally {
                                setReactingKey(null);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={type}
                                style={styles.reactionBtn}
                                onPress={onPressReaction}
                                activeOpacity={0.8}
                                disabled={busy}
                            >
                                {type === 'pray' ? (
                                    <MaterialCommunityIcons
                                        name="hands-pray"
                                        size={24}
                                        color={iconColor}
                                    />
                                ) : null}
                                {type === 'heart' ? (
                                    <Ionicons
                                        name={active ? 'heart' : 'heart-outline'}
                                        size={24}
                                        color={iconColor}
                                    />
                                ) : null}
                                {type === 'thumbs_up' ? (
                                    <Ionicons
                                        name={
                                            active
                                                ? 'thumbs-up'
                                                : 'thumbs-up-outline'
                                        }
                                        size={24}
                                        color={iconColor}
                                    />
                                ) : null}
                                {type === 'peace' ? (
                                    <MaterialCommunityIcons
                                        name="leaf"
                                        size={24}
                                        color={iconColor}
                                    />
                                ) : null}
                                {type === 'star' ? (
                                    <Ionicons
                                        name={active ? 'star' : 'star-outline'}
                                        size={24}
                                        color={iconColor}
                                    />
                                ) : null}
                                <Text
                                    style={[
                                        styles.reactionCount,
                                        active && styles.reactionCountActive,
                                    ]}
                                >
                                    {count}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPost}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadPosts(true)}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Поки немає оголошень</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={Boolean(selectedPost)}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedPost(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedPost(null)}
                    />
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {selectedPost?.title?.trim() || 'Без заголовка'}
                        </Text>
                        <Text style={styles.modalContent}>
                            {selectedPost?.content?.trim() || '...'}
                        </Text>
                <View style={styles.modalMetaWrap}>
                    <Text style={styles.modalMeta}>
                        {getFirstName(selectedPost?.authorName ?? '') || 'Автор'}
                    </Text>
                    <Text style={styles.modalMeta}>
                        {selectedPost?.createdAt
                            ? new Date(selectedPost.createdAt).toLocaleString('uk-UA', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : ''}
                    </Text>
                </View>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setSelectedPost(null)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalCloseText}>Закрити</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 8,
        minHeight: 40,
    },
    topBarSpacer: {
        flex: 1,
    },
    adminEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    adminEntryText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    newsSectionLabel: {
        marginTop: 2,
        marginBottom: 12,
    },
    postCard: {
        backgroundColor: Colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: Colors.tabShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    postTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },
    readMore: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
    },
    readMoreBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    postMetaRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    reactionsRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    reactionBtn: {
        flex: 1,
        minHeight: 38,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.inputBg,
        paddingVertical: 4,
    },
    reactionCount: {
        marginTop: 2,
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: '600',
    },
    reactionCountActive: {
        color: Colors.primary,
    },
    postMeta: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    emptyState: {
        paddingVertical: 26,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `${Colors.text}66`,
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 16,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    modalContent: {
        fontSize: 16,
        lineHeight: 25,
        color: Colors.text,
    },
    modalMetaWrap: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    modalMeta: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    modalCloseBtn: {
        marginTop: 14,
        alignSelf: 'flex-end',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: Colors.inputBg,
    },
    modalCloseText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});
