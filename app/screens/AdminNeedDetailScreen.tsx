import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
    AdminNeed,
    replyToAdminNeed,
    updateAdminNeedStatus,
    type NeedStatusAction,
} from '../../services/adminNeeds';
import { needId, needStatusLabel, needTypeLabel, type NeedType } from '../../services/needs';
import { Colors } from '../../constants/colors';
import { SessionExpiredError } from '../../services/session';
type Props = NativeStackScreenProps<RootStackParamList, 'AdminNeedDetail'>;

function statusBadgeColors(status: string) {
    const s = status?.toLowerCase?.() ?? '';
    if (s === 'виконано' || s === 'done' || s === 'closed') {
        return {
            bg: `${Colors.statusBadgeDone}22`,
            border: `${Colors.statusBadgeDone}66`,
            text: Colors.statusBadgeDone,
        };
    }
    if (s === 'в очікуванні' || s === 'in_progress' || s.includes('очікуван')) {
        return {
            bg: `${Colors.statusBadgeWaiting}22`,
            border: `${Colors.statusBadgeWaiting}66`,
            text: Colors.statusBadgeWaiting,
        };
    }
    if (s === 'нова' || s === 'new' || s === 'active' || s === 'open') {
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

export default function AdminNeedDetailScreen({ route, navigation }: Props) {
    const { need: initial } = route.params;
    const [need, setNeed] = useState<AdminNeed>(initial);
    const [busy, setBusy] = useState(false);
    const [replyVisible, setReplyVisible] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replySending, setReplySending] = useState(false);

    const id = needId(need);
    const archived = Boolean(need.archived);
    const pill = statusBadgeColors(need.status);
    const typeSafe =
        need.type === 'humanitarian' || need.type === 'other' ? need.type : 'other';

    const onPressPhone = () => {
        const n = need.phone?.trim();
        if (!n) return;
        const tel = normalizeTel(n);
        if (!tel) return;
        Linking.openURL(tel.startsWith('+') ? `tel:${tel}` : `tel:${tel}`).catch(() => {
            Alert.alert('Помилка', 'Не вдалось відкрити дзвінок');
        });
    };

    const onStatus = async (action: NeedStatusAction) => {
        if (!id) return;
        setBusy(true);
        try {
            const res = (await updateAdminNeedStatus(id, action)) as Record<string, unknown>;
            if (
                res &&
                typeof res.message === 'string' &&
                !('_id' in res) &&
                !('id' in res)
            ) {
                Alert.alert('Помилка', res.message);
                return;
            }
            if (res && typeof res === 'object' && res.need != null) {
                setNeed(res.need as AdminNeed);
            } else {
                navigation.goBack();
            }
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            Alert.alert(
                'Помилка',
                e instanceof Error ? e.message : 'Не вдалось оновити статус',
            );
        } finally {
            setBusy(false);
        }
    };

    const sendReply = async () => {
        const text = replyText.trim();
        if (!id) return;
        if (!text) {
            Alert.alert('Увага', 'Введіть текст відповіді');
            return;
        }
        setReplySending(true);
        try {
            const res = (await replyToAdminNeed(id, text)) as Record<string, unknown>;
            const isReplyOk = res && typeof res === 'object' && res.need != null;
            const isErrorShape =
                typeof res?.message === 'string' &&
                !isReplyOk &&
                !('_id' in res) &&
                !('id' in res);
            if (isErrorShape) {
                Alert.alert('Помилка', String(res.message));
                return;
            }
            setReplyVisible(false);
            setReplyText('');
            if (isReplyOk && res.need) {
                setNeed(res.need as AdminNeed);
            }
            Alert.alert('Готово', 'Відповідь надіслано');
        } catch (e) {
            if (e instanceof SessionExpiredError) return;
            Alert.alert(
                'Помилка',
                e instanceof Error ? e.message : 'Не вдалось надіслати відповідь',
            );
        } finally {
            setReplySending(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{(need.name ?? '').trim() || 'Без імені'}</Text>

                <View style={styles.row}>
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
                            {needStatusLabel(need.status)}
                        </Text>
                    </View>
                    <Text style={styles.typeBadge}>{needTypeLabel(typeSafe as NeedType)}</Text>
                </View>

                {need.date ? <Text style={styles.meta}>Подано: {need.date}</Text> : null}

                {need.phone ? (
                    <TouchableOpacity onPress={onPressPhone} activeOpacity={0.7} style={styles.phoneBlock}>
                        <Text style={styles.phoneLabel}>Телефон</Text>
                        <Text style={styles.phone}>{need.phone}</Text>
                    </TouchableOpacity>
                ) : null}

                <Text style={styles.sectionLabel}>Опис</Text>
                <Text style={styles.body}>{need.description || '—'}</Text>

                {need.replyMessage ? (
                    <View style={styles.replyBox}>
                        <Text style={styles.replyLabel}>Відповідь</Text>
                        <Text style={styles.replyText}>{need.replyMessage}</Text>
                    </View>
                ) : null}

                {!archived ? (
                    busy ? (
                        <View style={styles.busy}>
                            <ActivityIndicator color={Colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.actions}>
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.btnOutline, styles.btnHalf]}
                                    onPress={() => onStatus('in_progress')}
                                    activeOpacity={0.88}
                                >
                                    <Text style={styles.btnOutlineText}>В роботу</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnOutline, styles.btnHalf]}
                                    onPress={() => onStatus('done')}
                                    activeOpacity={0.88}
                                >
                                    <Text style={styles.btnOutlineText}>Виконано</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={() => {
                                    setReplyText('');
                                    setReplyVisible(true);
                                }}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.btnPrimaryText}>Відповісти</Text>
                            </TouchableOpacity>
                        </View>
                    )
                ) : (
                    <Text style={styles.archivedHint}>Заявка в архіві — дії недоступні.</Text>
                )}
            </ScrollView>

            <Modal visible={replyVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => !replySending && setReplyVisible(false)}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalKeyboard}
                    >
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Відповідь на заявку</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Текст відповіді…"
                                placeholderTextColor={Colors.textLight}
                                value={replyText}
                                onChangeText={setReplyText}
                                multiline
                                textAlignVertical="top"
                                editable={!replySending}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancel}
                                    onPress={() => !replySending && setReplyVisible(false)}
                                    disabled={replySending}
                                >
                                    <Text style={styles.modalCancelText}>Скасувати</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalSend, replySending && styles.modalSendDisabled]}
                                    onPress={sendReply}
                                    disabled={replySending}
                                >
                                    {replySending ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.modalSendText}>Надіслати</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
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
    scroll: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    statusPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusPillText: {
        fontSize: 13,
        fontWeight: '800',
    },
    typeBadge: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.accent,
    },
    meta: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 14,
    },
    phoneBlock: {
        marginBottom: 16,
    },
    phoneLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    phone: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.primary,
        textDecorationLine: 'underline',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textLight,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
        marginBottom: 16,
    },
    replyBox: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: `${Colors.primary}12`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${Colors.primary}44`,
        marginBottom: 20,
    },
    replyLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 6,
    },
    replyText: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },
    busy: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    actions: {
        marginTop: 8,
        gap: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    btnHalf: {
        flex: 1,
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnOutline: {
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: 12,
        backgroundColor: `${Colors.primary}0d`,
    },
    btnOutlineText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },
    btnPrimary: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnPrimaryText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.white,
    },
    archivedHint: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalKeyboard: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    modalInput: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.inputBg,
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalCancel: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textLight,
    },
    modalSend: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 12,
        minWidth: 120,
        alignItems: 'center',
    },
    modalSendDisabled: {
        opacity: 0.75,
    },
    modalSendText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
