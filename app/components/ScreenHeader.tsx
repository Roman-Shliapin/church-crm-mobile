import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    title: {
        ...Typography.screenTitle,
        fontSize: 24,
    },
    subtitle: {
        marginTop: 6,
        ...Typography.headerSubtitle,
    },
});
