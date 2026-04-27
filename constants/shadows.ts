import { Platform, ViewStyle } from 'react-native';

/** М’яка тінь для карток */
export const softCardShadow: ViewStyle =
    Platform.OS === 'ios'
        ? {
              shadowColor: '#3D2848',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
          }
        : { elevation: 2 };
