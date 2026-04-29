import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminPeoplePanel from './AdminPeoplePanel';
import { Colors } from '../../constants/colors';

export default function CandidatesScreen() {
    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <View style={styles.flex}>
                <AdminPeoplePanel initialSubTab="candidates" hideTabs />
            </View>
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
});
