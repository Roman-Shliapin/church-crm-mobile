import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import {
    createPost,
    deletePost,
    getPosts,
    togglePinPost,
    type Post,
} from '../../services/posts';
import { SessionExpiredError } from '../../services/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

const EXPIRE_OPTIONS: { label: string; days: number | null }[] = [
    { label: '1д', days: 1 },
    { label: '3д', days: 3 },
    { label: '7д', days: 7 },
    { label: '30д', days: 30 },
    { label: '∞', days: null },
];

function formatExpiry(iso: string | null | undefined): string | null {
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

export default function AdminScreen({ navigation }: Props) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [expireDays, setExpireDays] = useState<number | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [mutatingId, setMutatingId] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        try {
            setLoadingList(true);
            const list = await getPosts();
            setPosts(list);
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            Alert.alert('Помилка', e instanceof Error ? e.message : 'Не вдалось завантажити');
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const myPosts = posts.slice(0, 10);

    const onPublish = async () => {
        const t = title.trim();
        const c = content.trim();
        if (!t || !c) {
            Alert.alert('Увага', 'Заповніть заголовок і текст.');
            return;
        }
        try {
            setPublishing(true);
            await createPost({ title: t, content: c, expireDays });
            Alert.alert('✅ Опубліковано!');
            setTitle('');
            setContent('');
            setExpireDays(null);
            await loadPosts();
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            Alert.alert('Помилка', e instanceof Error ? e.message : 'Не вдалось опублікувати');
        } finally {
            setPublishing(false);
        }
    };

    const askDelete = (post: Post) => {
        Alert.alert('Видалити оголошення?', post.title || '', [
            { text: 'Скасувати', style: 'cancel' },
            {
                text: 'Видалити',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setMutatingId(post._id);
                        await deletePost(post._id);
                        await loadPosts();
                    } catch (e) {
                        if (e instanceof SessionExpiredError) return;
                        Alert.alert('Помилка', e instanceof Error ? e.message : 'Помилка');
                    } finally {
                        setMutatingId(null);
                    }
                },
            },
        ]);
    };

    const onTogglePin = async (post: Post) => {
        try {
            setMutatingId(post._id);
            const updated = await togglePinPost(post._id);
            setPosts((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p)),
            );
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            Alert.alert('Помилка', e instanceof Error ? e.message : 'Помилка');
        } finally {
            setMutatingId(null);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={[Typography.sectionLabel, styles.sectionLabel]}>
                    Швидкий доступ
                </Text>
                <View style={styles.grid}>
                    <TouchableOpacity
                        style={styles.gridBtn}
                        onPress={() => navigation.navigate('Members')}
                        activeOpacity={0.88}
                    >
                        <Text style={styles.gridBtnText}>👥 Члени церкви</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.gridBtn}
                        onPress={() => navigation.navigate('Candidates')}
                        activeOpacity={0.88}
                    >
                        <Text style={styles.gridBtnText}>🙋 Кандидати</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.gridBtn}
                        onPress={() =>
                            navigation.navigate('AdminNeeds', {
                                initialCategory: 'active',
                            })
                        }
                        activeOpacity={0.88}
                    >
                        <Text style={styles.gridBtnText}>📋 Активні заявки</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.gridBtn}
                        onPress={() =>
                            navigation.navigate('AdminNeeds', {
                                initialCategory: 'archived',
                            })
                        }
                        activeOpacity={0.88}
                    >
                        <Text style={styles.gridBtnText}>📦 Архів заявок</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[Typography.sectionLabel, styles.sectionLabel]}>
                    Створити оголошення
                </Text>
                <View style={styles.card}>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Заголовок"
                        placeholderTextColor={Colors.textLight}
                        style={styles.input}
                    />
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="Текст"
                        placeholderTextColor={Colors.textLight}
                        style={[styles.input, styles.contentInput]}
                        multiline
                        textAlignVertical="top"
                    />
                    <Text style={styles.expireLabel}>Термін дії</Text>
                    <View style={styles.expireRow}>
                        {EXPIRE_OPTIONS.map(({ label, days }) => {
                            const active = expireDays === days;
                            return (
                                <TouchableOpacity
                                    key={label}
                                    style={[styles.expireChip, active && styles.expireChipActive]}
                                    onPress={() => setExpireDays(days)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.expireChipText,
                                            active && styles.expireChipTextActive,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <TouchableOpacity
                        style={[styles.publishBtn, publishing && styles.publishDisabled]}
                        onPress={onPublish}
                        disabled={publishing}
                        activeOpacity={0.9}
                    >
                        {publishing ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.publishBtnText}>Опублікувати</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[Typography.sectionLabel, styles.sectionLabel]}>
                    Мої оголошення (останні 10)
                </Text>
                {loadingList ? (
                    <View style={styles.listLoading}>
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : myPosts.length === 0 ? (
                    <Text style={styles.emptyHint}>Поки немає оголошень</Text>
                ) : (
                    myPosts.map((post) => {
                        const date = new Date(post.createdAt);
                        const dateStr = Number.isNaN(date.getTime())
                            ? post.createdAt
                            : date.toLocaleString('uk-UA', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              });
                        const exp = formatExpiry(post.expiresAt ?? null);
                        const busy = mutatingId === post._id;
                        return (
                            <View key={post._id} style={styles.postCard}>
                                <Text style={styles.postTitle}>
                                    {post.title?.trim() || 'Без заголовка'}
                                </Text>
                                <Text style={styles.postDate}>{dateStr}</Text>
                                {post.pinned ? (
                                    <Text style={styles.pinned}>📌 Закріплено</Text>
                                ) : null}
                                {exp ? (
                                    <Text style={styles.expires}>⏱ Діє до: {exp}</Text>
                                ) : null}
                                <View style={styles.postActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => onTogglePin(post)}
                                        disabled={busy}
                                    >
                                        <Text style={styles.actionBtnText}>
                                            {post.pinned ? '📌 Відкріпити' : '📌 Закріпити'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => askDelete(post)}
                                        disabled={busy}
                                    >
                                        <Text style={[styles.actionBtnText, styles.deleteText]}>
                                            🗑️ Видалити
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
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
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    sectionLabel: {
        marginTop: 8,
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    gridBtn: {
        width: '48%',
        flexGrow: 1,
        minWidth: '47%',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.tabShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 3,
    },
    gridBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 14,
        marginBottom: 20,
        shadowColor: Colors.tabShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        borderRadius: 12,
        backgroundColor: Colors.inputBg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 10,
    },
    contentInput: {
        minHeight: 120,
    },
    expireLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 8,
    },
    expireRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    expireChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
    },
    expireChipActive: {
        borderColor: Colors.primary,
        backgroundColor: `${Colors.primary}18`,
    },
    expireChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textLight,
    },
    expireChipTextActive: {
        color: Colors.primary,
    },
    publishBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    publishDisabled: {
        opacity: 0.8,
    },
    publishBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    listLoading: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyHint: {
        color: Colors.textLight,
        fontSize: 15,
        marginBottom: 12,
    },
    postCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 12,
        marginBottom: 10,
        shadowColor: Colors.tabShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    postTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    postDate: {
        marginTop: 4,
        fontSize: 12,
        color: Colors.textLight,
    },
    pinned: {
        marginTop: 6,
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
    },
    expires: {
        marginTop: 4,
        fontSize: 13,
        color: Colors.textLight,
    },
    postActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: Colors.inputBg,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    deleteText: {
        color: Colors.error,
    },
});
