import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    useNavigation,
    useRoute,
    type RouteProp,
    CommonActions,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Languages } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { BibleStackParamList } from '../navigation/types';

const BOLLS_BASE = 'https://bolls.life';

const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '');

export const TRANSLATIONS = [
    { code: 'UBIO', name: 'Огієнко (1962)' },
    { code: 'UTT', name: 'Турконяк (2011)' },
    { code: 'HOM', name: 'Хоменко (1963)' },
] as const;

function translationShortLabel(fullName: string): string {
    const i = fullName.indexOf('(');
    return (i > 0 ? fullName.slice(0, i) : fullName).trim();
}

type BibleTranslationContextValue = {
    translationCode: string;
    translationName: string;
    translationShort: string;
    setTranslationCode: (code: string) => void;
};

const BibleTranslationContext =
    createContext<BibleTranslationContextValue | null>(null);

function useBibleTranslation(): BibleTranslationContextValue {
    const v = useContext(BibleTranslationContext);
    if (!v) {
        throw new Error('useBibleTranslation must be used within provider');
    }
    return v;
}

export type BibleBookRow = {
    bookid: number;
    name: string;
    chapters: number;
    chronorder?: number;
};

type BibleVerseRow = {
    pk: number;
    verse: number;
    text: string;
};

const Stack = createNativeStackNavigator<BibleStackParamList>();

/** Кеш списку книг по коду перекладу */
const booksCacheByTranslation = new Map<string, BibleBookRow[]>();

async function fetchBibleBooksFromNetwork(
    translation: string,
): Promise<BibleBookRow[]> {
    const res = await fetch(`${BOLLS_BASE}/get-books/${translation}/`);
    if (!res.ok) {
        throw new Error(`Не вдалося завантажити книги (${res.status})`);
    }
    const data = (await res.json()) as BibleBookRow[];
    if (!Array.isArray(data)) {
        throw new Error('Некоректна відповідь сервера');
    }
    return data;
}

async function getBibleBooksCached(
    translation: string,
): Promise<BibleBookRow[]> {
    const hit = booksCacheByTranslation.get(translation);
    if (hit) return hit;
    const list = await fetchBibleBooksFromNetwork(translation);
    booksCacheByTranslation.set(translation, list);
    return list;
}

async function fetchChapterVerses(
    translation: string,
    bookid: number,
    chapter: number,
): Promise<BibleVerseRow[]> {
    const res = await fetch(
        `${BOLLS_BASE}/get-chapter/${translation}/${bookid}/${chapter}/`,
    );
    if (!res.ok) {
        throw new Error(`Не вдалося завантажити главу (${res.status})`);
    }
    const data = (await res.json()) as BibleVerseRow[];
    return Array.isArray(data) ? data : [];
}

type BibleNav = NativeStackNavigationProp<BibleStackParamList, 'BibleBooks'>;
type BibleChaptersNav = NativeStackNavigationProp<BibleStackParamList, 'BibleChapters'>;
type BibleReaderNav = NativeStackNavigationProp<BibleStackParamList, 'BibleReader'>;

function BibleTranslationHeader() {
    const { translationCode, translationShort, setTranslationCode } =
        useBibleTranslation();
    const navigation =
        useNavigation<NativeStackNavigationProp<BibleStackParamList>>();
    const [modalVisible, setModalVisible] = useState(false);

    const applyTranslation = (code: string) => {
        setModalVisible(false);
        if (code === translationCode) return;
        setTranslationCode(code);
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'BibleBooks' }],
            }),
        );
    };

    return (
        <>
            <View style={styles.headerTranslationRow}>
                <Text
                    style={styles.headerTranslationName}
                    numberOfLines={1}
                >
                    {translationShort}
                </Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="Переклад Біблії"
                >
                    <Languages
                        size={24}
                        color={Colors.primary}
                        strokeWidth={2}
                    />
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.transModalOverlay}>
                    <TouchableOpacity
                        style={styles.transModalBackdrop}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                    />
                    <View style={styles.transModalCard}>
                        <Text style={styles.transModalTitle}>Переклад</Text>
                        {TRANSLATIONS.map(({ code, name }) => {
                            const selected = translationCode === code;
                            return (
                                <TouchableOpacity
                                    key={code}
                                    style={[
                                        styles.transModalRow,
                                        selected && styles.transModalRowSelected,
                                    ]}
                                    onPress={() => applyTranslation(code)}
                                    activeOpacity={0.85}
                                >
                                    <View
                                        style={[
                                            styles.radioOuter,
                                            selected && styles.radioOuterSelected,
                                        ]}
                                    >
                                        {selected ? (
                                            <View style={styles.radioInner} />
                                        ) : null}
                                    </View>
                                    <Text
                                        style={[
                                            styles.transModalRowText,
                                            selected &&
                                                styles.transModalRowTextSelected,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </>
    );
}

function HeaderBackToBooks({
    navigation,
}: {
    navigation: NativeStackNavigationProp<BibleStackParamList>;
}) {
    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('BibleBooks')}
            style={styles.headerLink}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Назад до книг"
        >
            <Text style={styles.headerLinkText} numberOfLines={1}>
                Назад до книг
            </Text>
        </TouchableOpacity>
    );
}

function BibleBooksScreen() {
    const navigation = useNavigation<BibleNav>();
    const { translationCode } = useBibleTranslation();
    const [books, setBooks] = useState<BibleBookRow[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getBibleBooksCached(translationCode)
            .then((list) => {
                if (!cancelled) setBooks(list);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(
                        e instanceof Error ? e.message : 'Помилка завантаження',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [translationCode]);

    const sections = useMemo(() => {
        if (!books?.length) return [];
        const ot = books.filter((b) => b.bookid >= 1 && b.bookid <= 39);
        const nt = books.filter((b) => b.bookid >= 40 && b.bookid <= 66);
        return [
            { title: 'Старий Завіт', data: ot },
            { title: 'Новий Завіт', data: nt },
        ];
    }, [books]);

    const onRefresh = () => {
        setRefreshing(true);
        booksCacheByTranslation.delete(translationCode);
        fetchBibleBooksFromNetwork(translationCode)
            .then((list) => {
                booksCacheByTranslation.set(translationCode, list);
                setBooks(list);
                setError(null);
            })
            .catch((e) =>
                setError(e instanceof Error ? e.message : 'Помилка'),
            )
            .finally(() => {
                setRefreshing(false);
            });
    };

    if (loading && !books?.length) {
        return (
            <SafeAreaView style={styles.centered} edges={['bottom']}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setLoading(true);
                            setError(null);
                            booksCacheByTranslation.delete(translationCode);
                            fetchBibleBooksFromNetwork(translationCode)
                                .then((list) => {
                                    booksCacheByTranslation.set(
                                        translationCode,
                                        list,
                                    );
                                    setBooks(list);
                                })
                                .catch((e) =>
                                    setError(
                                        e instanceof Error
                                            ? e.message
                                            : 'Помилка завантаження',
                                    ),
                                )
                                .finally(() => setLoading(false));
                        }}
                    >
                        <Text style={styles.retry}>Повторити</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            <SectionList
                sections={sections}
                keyExtractor={(item) => String(item.bookid)}
                stickySectionHeadersEnabled
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.bookRow}
                        onPress={() =>
                            navigation.navigate('BibleChapters', {
                                bookid: item.bookid,
                                bookName: item.name,
                                chapters: item.chapters,
                            })
                        }
                        activeOpacity={0.7}
                    >
                        <Text style={styles.bookName}>{item.name}</Text>
                        <Text style={styles.bookMeta}>{item.chapters} гл.</Text>
                    </TouchableOpacity>
                )}
                SectionSeparatorComponent={() => (
                    <View style={styles.sectionSep} />
                )}
                ItemSeparatorComponent={() => (
                    <View style={styles.itemSep} />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={styles.empty}>Немає даних</Text>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

function BibleChaptersScreen() {
    const navigation = useNavigation<BibleChaptersNav>();
    const route = useRoute<RouteProp<BibleStackParamList, 'BibleChapters'>>();
    const { width } = useWindowDimensions();
    const { bookid, bookName, chapters: chapterCount } = route.params;

    const cols = 5;
    const horizontalPad = 16;
    const gap = 8;
    const cellSize = Math.floor(
        (width - horizontalPad * 2 - gap * (cols - 1)) / cols,
    );

    const numbers = useMemo(
        () =>
            Array.from({ length: chapterCount }, (_, i) => i + 1),
        [chapterCount],
    );

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={styles.chapterScroll}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.chapterGrid}>
                    {numbers.map((n) => (
                        <TouchableOpacity
                            key={n}
                            style={[
                                styles.chapterCell,
                                {
                                    width: cellSize,
                                    minHeight: cellSize,
                                },
                            ]}
                            onPress={() =>
                                navigation.navigate('BibleReader', {
                                    bookid,
                                    bookName,
                                    chapter: n,
                                    chapters: chapterCount,
                                })
                            }
                            activeOpacity={0.85}
                        >
                            <Text style={styles.chapterNum}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function BibleReaderScreen() {
    const navigation = useNavigation<BibleReaderNav>();
    const route = useRoute<RouteProp<BibleStackParamList, 'BibleReader'>>();
    const { translationCode } = useBibleTranslation();
    const { bookid, bookName, chapter, chapters: chapterCount } =
        route.params;

    const [verses, setVerses] = useState<BibleVerseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchChapterVerses(translationCode, bookid, chapter)
            .then((rows) => {
                if (!cancelled) setVerses(rows);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(
                        e instanceof Error ? e.message : 'Помилка завантаження',
                    );
                    setVerses([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [translationCode, bookid, chapter]);

    const goPrev = () => {
        if (chapter <= 1) return;
        navigation.replace('BibleReader', {
            bookid,
            bookName,
            chapter: chapter - 1,
            chapters: chapterCount,
        });
    };

    const goNext = () => {
        if (chapter >= chapterCount) return;
        navigation.replace('BibleReader', {
            bookid,
            bookName,
            chapter: chapter + 1,
            chapters: chapterCount,
        });
    };

    return (
        <SafeAreaView style={styles.readerSafe} edges={['bottom']}>
            {loading ? (
                <View style={styles.readerLoading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.readerError}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.readerScroll}
                    contentContainerStyle={styles.readerContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {verses.map((v) => (
                        <View key={v.pk} style={styles.verseBlock}>
                            <Text style={styles.verseNum}>{v.verse}</Text>
                            <Text style={styles.verseText}>{stripHtml(v.text)}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            <View style={styles.readerFooter}>
                <TouchableOpacity
                    style={[
                        styles.navBtn,
                        chapter <= 1 && styles.navBtnDisabled,
                    ]}
                    onPress={goPrev}
                    disabled={chapter <= 1}
                    activeOpacity={0.85}
                >
                    <Text
                        style={[
                            styles.navBtnText,
                            chapter <= 1 && styles.navBtnTextDisabled,
                        ]}
                    >
                        ← Попередня
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.navBtn,
                        chapter >= chapterCount && styles.navBtnDisabled,
                    ]}
                    onPress={goNext}
                    disabled={chapter >= chapterCount}
                    activeOpacity={0.85}
                >
                    <Text
                        style={[
                            styles.navBtnText,
                            chapter >= chapterCount &&
                                styles.navBtnTextDisabled,
                        ]}
                    >
                        Наступна →
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

export default function BibleScreenStack() {
    const [translationCode, setTranslationCode] = useState<string>(
        TRANSLATIONS[0].code,
    );
    const meta = useMemo(
        () =>
            TRANSLATIONS.find((t) => t.code === translationCode) ??
            TRANSLATIONS[0],
        [translationCode],
    );

    const translationContext = useMemo<BibleTranslationContextValue>(
        () => ({
            translationCode: meta.code,
            translationName: meta.name,
            translationShort: translationShortLabel(meta.name),
            setTranslationCode,
        }),
        [meta.code, meta.name, setTranslationCode],
    );

    return (
        <BibleTranslationContext.Provider value={translationContext}>
            <Stack.Navigator
                screenOptions={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontWeight: '600',
                        fontSize: 17,
                        color: Colors.text,
                    },
                    headerStyle: {
                        backgroundColor: Colors.background,
                    },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: Colors.background },
                }}
            >
                <Stack.Screen
                    name="BibleBooks"
                    component={BibleBooksScreen}
                    options={{
                        title: 'Біблія',
                        headerRight: () => <BibleTranslationHeader />,
                    }}
                />
            <Stack.Screen
                name="BibleChapters"
                component={BibleChaptersScreen}
                options={({ navigation, route }) => ({
                    title: route.params.bookName,
                    headerLeft: () => (
                        <HeaderBackToBooks navigation={navigation} />
                    ),
                })}
            />
            <Stack.Screen
                name="BibleReader"
                component={BibleReaderScreen}
                options={({ navigation, route }) => ({
                    title: `${route.params.bookName} ${route.params.chapter}`,
                    headerLeft: () => (
                        <HeaderBackToBooks navigation={navigation} />
                    ),
                })}
            />
            </Stack.Navigator>
        </BibleTranslationContext.Provider>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    listContent: {
        paddingBottom: 24,
    },
    sectionHeader: {
        backgroundColor: Colors.inputBg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    sectionSep: {
        height: 8,
    },
    bookRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
    },
    bookName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
        paddingRight: 12,
    },
    bookMeta: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    itemSep: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginLeft: 16,
    },
    empty: {
        textAlign: 'center',
        marginTop: 48,
        color: Colors.textLight,
        fontSize: 16,
    },
    errorBanner: {
        padding: 12,
        backgroundColor: `${Colors.error}14`,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    retry: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    chapterScroll: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    chapterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chapterCell: {
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterNum: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    readerSafe: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    readerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    readerError: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    readerScroll: {
        flex: 1,
    },
    readerContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    verseBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
        gap: 10,
    },
    verseNum: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.accent,
        minWidth: 28,
        paddingTop: 3,
    },
    verseText: {
        flex: 1,
        fontSize: 17,
        lineHeight: 28,
        color: Colors.text,
    },
    readerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: 12,
    },
    navBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    navBtnDisabled: {
        opacity: 0.45,
    },
    navBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    navBtnTextDisabled: {
        color: Colors.textLight,
    },
    headerLink: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    headerLinkText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
    },
    headerTranslationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 4,
        maxWidth: 200,
    },
    headerTranslationName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        flexShrink: 1,
    },
    transModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    transModalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    transModalCard: {
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
    transModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        marginBottom: 4,
    },
    transModalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    transModalRowSelected: {
        backgroundColor: `${Colors.primary}14`,
    },
    transModalRowText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    transModalRowTextSelected: {
        color: Colors.primary,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    radioOuterSelected: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
});
