import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface MediaCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export abstract class BaseMediaService {
  protected cacheDirectory: string;
  protected defaultCompressionOptions: Required<MediaCompressionOptions> = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'jpeg',
  };

  constructor(mediaType: 'photo' | 'video') {
    this.cacheDirectory = `${FileSystem.cacheDirectory}${mediaType}-cache/`;
  }

  protected getCacheKey(url: string): string {
    const urlParts = url.split('/');
    return url.split('/').pop()?.split('?')[0] || '';
  }

  protected async getCachedMediaUri(url: string): Promise<string | null> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachePath = `${this.cacheDirectory}${cacheKey}`;
      const stupaKey = url.split('%2F')[1];
      const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}`;

      const fileInfo = await FileSystem.getInfoAsync(cachePath);

      if (fileInfo.exists) {
        console.log('Using cached media file at', cachePath);
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached media:', error);
      return null;
    }
  }

  protected async cacheMedia(url: string): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachePath = `${this.cacheDirectory}${cacheKey}`;
      const stupaKey = url.split('%2F')[1];
      const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}`;

      // Ensure folder exists
      const folderInfo = await FileSystem.getInfoAsync(folderPath);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
      }

      // Check if already cached
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      // Download and cache the media
      const downloadResult = await FileSystem.downloadAsync(url, cachePath);

      if (downloadResult.status === 200) {
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      throw new Error('Failed to download media');
    } catch (error) {
      console.error('Error caching media:', error);
      throw error;
    }
  }

  protected async uploadMedia(stupaId: string, mediaUri: string, mediaType: 'photos' | 'videos'): Promise<string> {
    try {
      const storageRef = ref(storage, `stupas/${stupaId}/${mediaType}/${Date.now()}.${mediaType === 'photos' ? 'jpg' : 'mp4'}`);
      console.log('stupaId', stupaId);
      console.log('Uploading media to:', storageRef.fullPath);
      
      const response = await fetch(mediaUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload media');
    }
  }

  async cleanupCache(): Promise<void> {
    try {
      const cacheInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (cacheInfo.exists) {
        // Implement cache cleanup logic here (e.g., remove old files)
        // This is a placeholder for future implementation
      }
    } catch (error) {
      console.error('Error cleaning up media cache:', error);
    }
  }
} 