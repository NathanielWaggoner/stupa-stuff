import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { stupaService } from '@/services/stupa.service';
import { prayerService } from '@/services/prayer.service';
import { Stupa } from '@/store/slices/stupaSlice';
import { useAuth } from '@/hooks/useAuth';

export default function StupaDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stupa, setStupa] = useState<Stupa | null>(null);
  const [loading, setLoading] = useState(true);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const unsubscribe = stupaService.subscribeToStupa(id, (updatedStupa) => {
      setStupa(updatedStupa);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleOfferPrayer = async () => {
    if (!stupa || !user) {
      router.push('/login');
      return;
    }

    setPrayerLoading(true);
    try {
      await prayerService.addPrayer(stupa.id, '', false);
    } catch (error) {
      console.error('Error offering prayer:', error);
    } finally {
      setPrayerLoading(false);
    }
  };

  const handleEdit = () => {
    if (!stupa) return;
    router.push({
      pathname: '/(tabs)/profile',
      params: { editStupaId: stupa.id }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (!stupa) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Stupa not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{stupa.title}</Text>
        {/* {user?.uid === stupa.createdBy && ( */}
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <FontAwesome name="edit" size={20} color="#666" />
          </TouchableOpacity>
        {/* )} */}
      </View>

      <Text style={styles.description}>{stupa.description}</Text>

      {stupa.videoUrls && stupa.videoUrls.length > 0 && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: stupa.videoUrls[0] }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
          />
        </View>
      )}

      <View style={styles.prayerSection}>
        <Text style={styles.prayerCount}>
          {stupa.prayerCount || 0} prayers offered
        </Text>
        <TouchableOpacity
          style={[styles.prayerButton, prayerLoading && styles.prayerButtonDisabled]}
          onPress={handleOfferPrayer}
          disabled={prayerLoading}
          activeOpacity={0.7}
        >
          {prayerLoading ? (
            <ActivityIndicator size="small" color="#FF4B4B" />
          ) : (
            <>
              <FontAwesome name="heart" size={24} color="#FF4B4B" />
              <Text style={styles.prayerButtonText}>Offer Prayer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.locationText}>
          Latitude: {stupa.location.latitude.toFixed(6)}
        </Text>
        <Text style={styles.locationText}>
          Longitude: {stupa.location.longitude.toFixed(6)}
        </Text>
      </View>

      {stupa.osmTags && (
        <View style={styles.osmSection}>
          <Text style={styles.sectionTitle}>OpenStreetMap Data</Text>
          {Object.entries(stupa.osmTags).map(([key, value]) => (
            <Text key={key} style={styles.osmTag}>
              {key}: {value}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    color: '#333',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  prayerSection: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  prayerCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4B4B',
    minHeight: 56,
    minWidth: 200,
    marginVertical: 8,
  },
  prayerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4B4B',
  },
  prayerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  locationSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  osmSection: {
    padding: 16,
  },
  osmTag: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 