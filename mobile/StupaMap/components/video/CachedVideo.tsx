import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { videoService } from '@/services/video.service';

interface CachedVideoProps {
  source: { uri: string };
  style?: any;
  resizeMode?: ResizeMode;
  useNativeControls?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function CachedVideo({
  source,
  style,
  resizeMode = ResizeMode.CONTAIN,
  useNativeControls = true,
  onLoad,
  onError,
}: CachedVideoProps) {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached video first
        const cachedUri = await videoService.getCachedVideoUri(source.uri);
        
        if (cachedUri) {
          if (mounted) {
            setVideoUri(cachedUri);
            setLoading(false);
            onLoad?.();
          }
          return;
        }

        // If not cached, download and cache it
        const newCachedUri = await videoService.cacheVideo(source.uri);
        
        if (mounted) {
          setVideoUri(newCachedUri);
          setLoading(false);
          onLoad?.();
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
          onError?.(err as Error);
        }
      }
    };

    loadVideo();

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

  if (error || !videoUri) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <Video
      source={{ uri: videoUri }}
      style={[styles.video, style]}
      resizeMode={resizeMode}
      useNativeControls={useNativeControls}
      onError={(error) => onError?.(new Error(error))}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
}); 