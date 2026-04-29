import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home } from 'lucide-react-native';
import { api } from '../../services/api';
import { saveToken, saveUserId } from '../../services/auth';
import { userIdFromToken } from '../../services/jwt';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { softCardShadow } from '../../constants/shadows';
import type { AppUser } from '../types/auth';
import { validateLoginForm } from '../../utils/validation';

export default function LoginScreen({
    onLogin,
    onGoRegister,
}: {
    onLogin: (user: AppUser) => void;
    onGoRegister?: () => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        const validationError = validateLoginForm(email, password);
        if (validationError) {
            Alert.alert('Помилка', validationError);
            return;
        }

        setLoading(true);
        try {
            const data = await api.post('/auth/login', {
                email: email.trim().toLowerCase(),
                password,
            });

            if (data.token) {
                const uid =
                    typeof data.userId === 'string'
                        ? data.userId
                        : userIdFromToken(data.token);
                if (uid) {
                    await saveUserId(uid);
                }
                await saveToken(data.token);
                onLogin({
                    token: data.token,
                    role: data.role,
                    name: typeof data.name === 'string' ? data.name : undefined,
                    userId: uid,
                });
            } else {
                Alert.alert('Помилка', data.message || 'Невідома помилка');
            }
        } catch {
            Alert.alert('Помилка', 'Не вдалось підключитись до сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.brandBlock}>
                        <View style={styles.logoRing}>
                            <View style={styles.logoInner}>
                                <Home size={36} color={Colors.white} strokeWidth={1.85} />
                            </View>
                        </View>
                        <Text style={styles.churchLine}>Церква Христова</Text>
                        <Text style={styles.cityLine}>м. Вінниця</Text>
                        <Text style={styles.screenTitle}>Вхід</Text>
                        <Text style={styles.screenHint}>
                            CRM для учасників та служіння
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Пароль</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Увійти</Text>
                            )}
                        </TouchableOpacity>

                        {onGoRegister ? (
                            <TouchableOpacity
                                style={styles.linkBelow}
                                onPress={onGoRegister}
                                disabled={loading}
                                hitSlop={8}
                            >
                                <Text style={styles.linkBelowText}>
                                    Немає акаунту?{' '}
                                    <Text style={styles.linkBelowBold}>Зареєструватись</Text>
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 24,
    },
    brandBlock: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoRing: {
        padding: 4,
        borderRadius: 52,
        backgroundColor: Colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        marginBottom: 18,
        ...softCardShadow,
    },
    logoInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    churchLine: {
        ...Typography.sectionLabel,
        color: Colors.accent,
        letterSpacing: 1.4,
    },
    cityLine: {
        marginTop: 4,
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textLight,
        marginBottom: 14,
    },
    screenTitle: {
        ...Typography.screenTitle,
    },
    screenHint: {
        marginTop: 8,
        ...Typography.muted,
        textAlign: 'center',
        maxWidth: 300,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        padding: 20,
        ...softCardShadow,
    },
    field: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: Colors.inputBg,
        color: Colors.text,
    },
    button: {
        marginTop: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    buttonDisabled: {
        opacity: 0.85,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '600',
    },
    linkBelow: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkBelowText: {
        fontSize: 15,
        color: Colors.textLight,
        textAlign: 'center',
    },
    linkBelowBold: {
        color: Colors.primary,
        fontWeight: '600',
    },
});
