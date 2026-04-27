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
import { ChevronLeft } from 'lucide-react-native';
import { api } from '../../services/api';
import { saveToken } from '../../services/auth';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { softCardShadow } from '../../constants/shadows';
import type { AppUser } from '../types/auth';
import { normalizePhone, validateRegisterForm } from '../../utils/validation';

type RegisterScreenProps = {
    onRegistered: (user: AppUser) => void;
    onGoLogin: () => void;
};

export default function RegisterScreen({
    onRegistered,
    onGoLogin,
}: RegisterScreenProps) {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const validationError = validateRegisterForm(phone, email, password, password2);
        if (validationError) {
            Alert.alert('Помилка', validationError);
            return;
        }

        const phoneNorm = normalizePhone(phone);
        setLoading(true);
        try {
            const data = await api.post('/auth/register', {
                phone: phoneNorm,
                email: email.trim().toLowerCase(),
                password,
            });

            if (data.token) {
                await saveToken(data.token);
                onRegistered({
                    token: data.token,
                    role: data.role,
                    name: typeof data.name === 'string' ? data.name : undefined,
                });
            } else {
                Alert.alert('Помилка', data.message || 'Не вдалось зареєструватись');
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
                    <TouchableOpacity
                        style={styles.backRow}
                        onPress={onGoLogin}
                        disabled={loading}
                        hitSlop={12}
                    >
                        <ChevronLeft size={22} color={Colors.primary} strokeWidth={2} />
                        <Text style={styles.backText}>До входу</Text>
                    </TouchableOpacity>

                    <View style={styles.brandBlock}>
                        <Text style={styles.screenTitle}>Реєстрація</Text>
                        <Text style={styles.screenHint}>
                            Якщо ви вже в базі церкви (через бота), вкажіть той самий
                            номер телефону, email і задайте пароль для входу в
                            застосунок.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Телефон</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+380671112233"
                                placeholderTextColor={Colors.textLight}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
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
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Підтвердження пароля</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textLight}
                                value={password2}
                                onChangeText={setPassword2}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Зареєструватись</Text>
                            )}
                        </TouchableOpacity>
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
        paddingHorizontal: 22,
        paddingVertical: 20,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
    },
    brandBlock: {
        marginBottom: 22,
    },
    screenTitle: {
        ...Typography.screenTitle,
        marginBottom: 10,
    },
    screenHint: {
        ...Typography.muted,
        maxWidth: 340,
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
});
