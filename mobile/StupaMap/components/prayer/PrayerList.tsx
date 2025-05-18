import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Prayer {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

interface PrayerListProps {
  prayers?: Prayer[];
  onPrayerPress?: (prayer: Prayer) => void;
}

export function PrayerList({ prayers = [], onPrayerPress }: PrayerListProps) {
  const renderPrayerItem = ({ item }: { item: Prayer }) => (
    <View style={styles.prayerItem}>
      <View style={styles.prayerHeader}>
        <FontAwesome name="user-circle" size={24} color="#666" />
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.prayerText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Prayers</Text>
      <FlatList
        data={prayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  prayerItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    marginLeft: 10,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
}); 