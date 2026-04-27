import { View, StyleSheet, Platform } from 'react-native';
import {
    BottomTabBar,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';

/** Таб-бар: тонка смуга `primary` лише над активною вкладкою (без фону-прямокутника). */
export function CustomTabBar(props: BottomTabBarProps) {
    const { state } = props;

    return (
        <View
            style={[
                styles.wrap,
                Platform.OS === 'ios' ? styles.shadowIos : styles.shadowAndroid,
            ]}
        >
            <View style={styles.indicatorRow}>
                {state.routes.map((route, index) => {
                    const focused = state.index === index;
                    return (
                        <View key={route.key} style={styles.indicatorCell}>
                            {focused ? (
                                <View style={styles.indicatorBar} />
                            ) : (
                                <View style={styles.indicatorSpacer} />
                            )}
                        </View>
                    );
                })}
            </View>
            <BottomTabBar {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: Colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
    shadowIos: {
        shadowColor: Colors.tabShadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    shadowAndroid: {
        elevation: 8,
    },
    indicatorRow: {
        flexDirection: 'row',
        height: 3,
        backgroundColor: Colors.surface,
    },
    indicatorCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    indicatorBar: {
        width: '56%',
        maxWidth: 56,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    indicatorSpacer: {
        height: 3,
    },
});
