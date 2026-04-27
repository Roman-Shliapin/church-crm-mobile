import {
    View,
    Pressable,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { softCardShadow } from '../../constants/shadows';

type AppCardProps = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
};

/** Біла картка з радіусом 16 і м’якою тінню (як у адмін-хабі). */
export function AppCard({ children, onPress, style }: AppCardProps) {
    const base = [styles.card, style];
    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [base, pressed && styles.pressed]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        );
    }
    return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
        ...softCardShadow,
    },
    pressed: {
        opacity: 0.92,
    },
});
