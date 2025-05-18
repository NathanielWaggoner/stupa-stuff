import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Contribution {
  id: string;
  type: 'stupa' | 'prayer' | 'video';
  title: string;
  date: Date;
  status: 'public' | 'private';
}

interface ContributionsProps {
  contributions?: Contribution[];
  onContributionPress?: (contribution: Contribution) => void;
}

export function Contributions({
  contributions = [],
  onContributionPress,
}: ContributionsProps) {
  const getIcon = (type: Contribution['type']) => {
    switch (type) {
      case 'stupa':
        return 'map-marker';
      case 'prayer':
        return 'heart';
      case 'video':
        return 'video-camera';
      default:
        return 'question';
    }
  };

  const renderContributionItem = ({ item }: { item: Contribution }) => (
    <TouchableOpacity
      style={styles.contributionItem}
      onPress={() => onContributionPress?.(item)}
    >
      <View style={styles.itemHeader}>
        <FontAwesome name={getIcon(item.type)} size={20} color="#666" />
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'public' ? '#E3F2FD' : '#FFF3E0',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === 'public' ? '#1976D2' : '#F57C00',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.itemDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Contributions</Text>
      <FlatList
        data={contributions}
        renderItem={renderContributionItem}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  contributionItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
}); 