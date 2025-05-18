import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PrayerCounter } from '@/components/prayer/PrayerCounter';
import { PrayerList } from '@/components/prayer/PrayerList';
import { PrayerStats } from '@/components/prayer/PrayerStats';

export default function PrayerScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <PrayerCounter />
      <PrayerList />
      <PrayerStats />
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