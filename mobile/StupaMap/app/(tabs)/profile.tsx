import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserInfo } from '@/components/profile/UserInfo';
import { Contributions } from '@/components/profile/Contributions';
import { Settings } from '@/components/profile/Settings';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <UserInfo />
      <Contributions />
      <Settings />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
}); 