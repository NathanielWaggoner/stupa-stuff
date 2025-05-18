import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface PrayerStatsProps {
  totalPrayers?: number;
  uniqueStupas?: number;
  lastPrayerDate?: Date;
}

export function PrayerStats({
  totalPrayers = 0,
  uniqueStupas = 0,
  lastPrayerDate,
}: PrayerStatsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Prayer Journey</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <FontAwesome name="heart" size={24} color="#FF4B4B" />
          <Text style={styles.statValue}>{totalPrayers}</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="map-marker" size={24} color="#4B7BFF" />
          <Text style={styles.statValue}>{uniqueStupas}</Text>
          <Text style={styles.statLabel}>Unique Stupas</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="calendar" size={24} color="#47B881" />
          <Text style={styles.statValue}>
            {lastPrayerDate
              ? new Date(lastPrayerDate).toLocaleDateString()
              : 'Never'}
          </Text>
          <Text style={styles.statLabel}>Last Prayer</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 