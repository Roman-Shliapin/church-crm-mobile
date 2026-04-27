import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
    heroTitle: {
        fontSize: 30,
        fontWeight: '700' as const,
        color: Colors.text,
        letterSpacing: -0.6,
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: '700' as const,
        color: Colors.text,
        letterSpacing: -0.4,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '400' as const,
        color: Colors.textLight,
        lineHeight: 22,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.textLight,
        letterSpacing: 1.2,
        textTransform: 'uppercase' as const,
    },
    body: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
    },
    muted: {
        fontSize: 14,
        color: Colors.textLight,
        lineHeight: 20,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600' as const,
        color: Colors.text,
    },
    cardSubtitle: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: Colors.textLight,
        lineHeight: 20,
    },
} satisfies Record<string, TextStyle>;
