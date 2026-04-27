import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

type Props = {
    children: ReactNode;
    onReset?: () => void;
};

type State = {
    hasError: boolean;
    message: string;
};

/** Ловить необроблені помилки React у дереві дочірніх компонентів. */
export class AppErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message || 'Невідома помилка' };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.warn('[AppErrorBoundary]', error.message, info.componentStack);
    }

    private handleReset = (): void => {
        this.setState({ hasError: false, message: '' });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <View style={styles.wrap}>
                    <Text style={styles.title}>Щось пішло не так</Text>
                    <Text style={styles.hint}>{this.state.message}</Text>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={this.handleReset}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnText}>Спробувати знову</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    hint: {
        fontSize: 15,
        color: Colors.textLight,
        textAlign: 'center',
        marginBottom: 24,
    },
    btn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    btnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
