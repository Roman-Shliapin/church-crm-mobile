import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NeedsStackParamList } from '../navigation/types';
import { createNeed } from '../../services/needs';
import type { NeedType } from '../../services/needs';
import { Colors } from '../../constants/colors';
import { SessionExpiredError } from '../../services/session';

type Step = 'chooseType' | 'humanitarianChoice' | 'otherForm';

type Nav = NativeStackNavigationProp<NeedsStackParamList, 'CreateNeed'>;

const OTHER_MIN_LEN = 5;

export default function CreateNeedScreen() {
    const navigation = useNavigation<Nav>();
    const [step, setStep] = useState<Step>('chooseType');
    const [otherDescription, setOtherDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const goBackStep = useCallback(() => {
        if (step === 'chooseType') {
            navigation.goBack();
            return;
        }
        setStep('chooseType');
        setOtherDescription('');
    }, [navigation, step]);

    const submit = useCallback(
        async (description: string, type: NeedType) => {
            setSubmitting(true);
            try {
                await createNeed({ description, type });
                Alert.alert('✅ Заявку подано!', '', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            } catch (e) {
                if (e instanceof SessionExpiredError) return;
                Alert.alert(
                    'Помилка',
                    e instanceof Error ? e.message : 'Не вдалось надіслати заявку',
                );
            } finally {
                setSubmitting(false);
            }
        },
        [navigation],
    );

    const onPickHumanitarian = () => {
        setStep('humanitarianChoice');
    };

    const onPickOther = () => {
        setStep('otherForm');
    };

    const onHumanitarianProduct = () => {
        void submit('Продукти', 'humanitarian');
    };

    const onHumanitarianChem = () => {
        void submit('Хімія', 'humanitarian');
    };

    const onSubmitOther = () => {
        const text = otherDescription.trim();
        if (text.length < OTHER_MIN_LEN) {
            Alert.alert(
                'Увага',
                `Опишіть запит мінімум у ${OTHER_MIN_LEN} символів.`,
            );
            return;
        }
        void submit(text, 'other');
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {step !== 'chooseType' ? (
                        <TouchableOpacity
                            onPress={goBackStep}
                            disabled={submitting}
                            style={styles.backLink}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.backLinkText}>← Змінити тип</Text>
                        </TouchableOpacity>
                    ) : null}

                    {step === 'chooseType' ? (
                        <>
                            <Text style={styles.lead}>
                                Оберіть категорію звернення — далі покажемо короткі кроки.
                            </Text>
                            <TouchableOpacity
                                style={[styles.mainBtn, styles.btnPrimary]}
                                onPress={onPickHumanitarian}
                                disabled={submitting}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.mainBtnText}>🛒 Гуманітарна допомога</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mainBtn, styles.btnAccent]}
                                onPress={onPickOther}
                                disabled={submitting}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.mainBtnTextDark}>💬 Інше</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}

                    {step === 'humanitarianChoice' ? (
                        <>
                            <Text style={styles.lead}>
                                Що саме потрібно? Натисніть один варіант — заявку буде надіслано
                                одразу.
                            </Text>
                            {submitting ? (
                                <View style={styles.humanitarianLoading}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loadingCaption}>Надсилання…</Text>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.mainBtn, styles.btnPrimary]}
                                        onPress={onHumanitarianProduct}
                                        activeOpacity={0.88}
                                    >
                                        <Text style={styles.mainBtnText}>Продукти</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.mainBtn, styles.btnPrimaryOutline]}
                                        onPress={onHumanitarianChem}
                                        activeOpacity={0.88}
                                    >
                                        <Text style={styles.mainBtnTextOutline}>Хімія</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    ) : null}

                    {step === 'otherForm' ? (
                        <>
                            <Text style={styles.lead}>
                                Опишіть ситуацію своїми словами (не менше {OTHER_MIN_LEN}{' '}
                                символів).
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Текст звернення…"
                                placeholderTextColor={Colors.textLight}
                                value={otherDescription}
                                onChangeText={setOtherDescription}
                                multiline
                                textAlignVertical="top"
                                editable={!submitting}
                            />
                            <TouchableOpacity
                                style={[styles.mainBtn, styles.btnPrimary, submitting && styles.btnDisabled]}
                                onPress={onSubmitOther}
                                disabled={submitting}
                                activeOpacity={0.88}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <Text style={styles.mainBtnText}>Надіслати</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : null}
                </ScrollView>
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
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 28,
    },
    backLink: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    backLinkText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.accent,
    },
    lead: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textLight,
        marginBottom: 20,
    },
    mainBtn: {
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        minHeight: 52,
    },
    btnPrimary: {
        backgroundColor: Colors.primary,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    btnPrimaryOutline: {
        backgroundColor: Colors.inputBg,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    btnAccent: {
        backgroundColor: Colors.accent,
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    btnDisabled: {
        opacity: 0.75,
    },
    mainBtnText: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
    mainBtnTextDark: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
    mainBtnTextOutline: {
        color: Colors.primary,
        fontSize: 17,
        fontWeight: '700',
    },
    input: {
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
    humanitarianLoading: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    loadingCaption: {
        marginTop: 12,
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '600',
    },
});
