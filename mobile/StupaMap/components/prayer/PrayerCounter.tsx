import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PrayerCounterProps {
  count?: number;
  onPray?: () => void;
}

export function PrayerCounter({ count = 0, onPray }: PrayerCounterProps) {
  const handlePrayPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPray?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Total Prayers</Text>
      <Text style={styles.count}>{count.toLocaleString()}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePrayPress}>
        <FontAwesome name="heart" size={24} color="#FF4B4B" />
        <Text style={styles.buttonText}>Offer Prayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  count: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 15,
    borderRadius: 25,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
  },
}); 