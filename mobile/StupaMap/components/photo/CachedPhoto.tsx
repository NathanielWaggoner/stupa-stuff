import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, NativeSyntheticEvent, ImageErrorEventData } from 'react-native';
import { photoService } from '@/services/photo.service';
import { PhotoViewer } from './PhotoViewer';

interface CachedPhotoProps {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
}

export function CachedPhoto({
  source,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
}: CachedPhotoProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPhoto = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached photo first
        const cachedUri = await photoService.getCachedPhotoUri(source.uri);
        
        if (cachedUri) {
          if (mounted) {
            setPhotoUri(cachedUri);
            setLoading(false);
            onLoad?.();
          }
          return;
        }

        // If not cached, download and cache it
        const newCachedUri = await photoService.cachePhoto(source.uri);
        
        if (mounted) {
          setPhotoUri(newCachedUri);
          setLoading(false);
          onLoad?.();
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
          onError?.(err as NativeSyntheticEvent<ImageErrorEventData>);
        }
      }
    };

    loadPhoto();

    return () => {
      mounted = false;
    };
  }, [source.uri]);

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  if (error || !photoUri) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <PhotoViewer
      imageUrl={photoUri}
      style={[styles.photo, style]}
      resizeMode={resizeMode}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  photo: {
    flex: 1,
    width: '100%',
  },
}); 