import { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import { api } from '../../services/api'
import { saveToken } from '../../services/auth'
import { Colors } from '../../constants/colors'



export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Помилка', 'Введіть email та пароль')
            return
        };

        setLoading(true);
        try {
            const data = await api.post('/auth/login', { email, password });

            if (data.token) {
                await saveToken(data.token);
                Alert.alert('Успіх', `Вітаємо, ${data.name}!`)
            } else {
                Alert.alert('Помилка', data.message || 'Невідома помилка')
            }
        } catch (error) {
            Alert.alert('Помилка', 'Не вдалось підключитись до сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={styles.title}>Церква Христова м. Вінниця</Text>
            <Text style={styles.subtitle}>Вхід до системи</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Пароль"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Завантаження...' : 'Увійти'}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        color: Colors.textLight,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: Colors.white,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
})


