import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { stupaService } from '@/services/stupa.service';
import { photoService } from '@/services/photo.service';
import { useAuth } from '@/hooks/useAuth';

export default function AddStupaScreen() {
  const { latitude, longitude } = useLocalSearchParams<{ latitude: string; longitude: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.5,
        videoMaxDuration: 60,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handlePickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled) {
        setPhotoUris([...photoUris, ...result.assets.map(asset => asset.uri)]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris(photoUris.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the stupa.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for the stupa.');
      return;
    }

    setLoading(true);
    try {
      const stupa = await stupaService.addStupa({
        title: title.trim(),
        description: description.trim(),
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        createdBy: user?.uid || 'anonymous',
        isPublic: true,
        videoUrls: [],
        photoUrls: [],
        prayerCount: 0,
        createdAt: new Date().toISOString(),
        lastPrayerAt: new Date().toISOString(),
      });

      // Upload video if selected
      if (videoUri) {
        try {
          const videoUrl = await stupaService.uploadStupaVideo(stupa.id, videoUri);
          await stupaService.updateStupa(stupa.id, {
            videoUrls: [videoUrl],
          });
        } catch (error) {
          console.error('Error uploading video:', error);
        }
      }

      // Upload photos if selected
      if (photoUris.length > 0) {
        try {
          const photoUrls = await Promise.all(
            photoUris.map(uri => photoService.uploadStupaPhoto(stupa.id, uri))
          );
          await stupaService.updateStupa(stupa.id, {
            photoUrls,
          });
        } catch (error) {
          console.error('Error uploading photos:', error);
        }
      }

      Alert.alert('Success', 'Stupa added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding stupa:', error);
      Alert.alert('Error', 'Failed to add stupa. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter stupa title"
          maxLength={100}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter stupa description"
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <Text style={styles.label}>Location</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            Latitude: {parseFloat(latitude).toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {parseFloat(longitude).toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.mediaButton}
          onPress={handlePickVideo}
        >
          <FontAwesome name="video-camera" size={20} color="#666" />
          <Text style={styles.mediaButtonText}>
            {videoUri ? 'Change Video' : 'Add Video'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaButton}
          onPress={handlePickPhotos}
        >
          <FontAwesome name="camera" size={20} color="#666" />
          <Text style={styles.mediaButtonText}>
            Add Photos ({photoUris.length}/10)
          </Text>
        </TouchableOpacity>

        {photoUris.length > 0 && (
          <FlatList
            data={photoUris}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: item }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <FontAwesome name="times-circle" size={24} color="#FF4B4B" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => setIsPublic(!isPublic)}
        >
          <FontAwesome
            name={isPublic ? 'globe' : 'lock'}
            size={20}
            color="#666"
          />
          <Text style={styles.visibilityButtonText}>
            {isPublic ? 'Public' : 'Private'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="plus" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add Stupa</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  photoPreviewContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  visibilityButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 