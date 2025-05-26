import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

class PhotoService {
  private cacheDirectory: string;

  constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}photo-cache/`;
  }

  async uploadStupaPhoto(stupaId: string, photoUri: string): Promise<string> {
    try {
      const storageRef = ref(storage, `stupas/${stupaId}/photos/${Date.now()}.jpg`);
      console.log('stupaId', stupaId);
      console.log('Uploading photo to:', storageRef.fullPath);
      const response = await fetch(photoUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  private getCacheKey(url: string): string {
    const urlParts = url.split('/');
    return url.split('/').pop()?.split('?')[0] || '';
  }

  async getCachedPhotoUri(url: string): Promise<string | null> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachePath = `${this.cacheDirectory}${cacheKey}`;
      const stupaKey = url.split('%2F')[1];
      const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}`;

      const fileInfo = await FileSystem.getInfoAsync(cachePath);

      if (fileInfo.exists) {
        console.log('Using cached photo file at', cachePath);
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached photo:', error);
      return null;
    }
  }

  async cachePhoto(url: string): Promise<string> {
    try {
      console.log('cachePhoto', url);
      const cacheKey = this.getCacheKey(url);
      console.log('cacheKey', cacheKey);
      const cachePath = `${this.cacheDirectory}${cacheKey}`;
      console.log('cachePath', cachePath);
      const stupaKey = url.split('%2F')[1];
      const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}/photos/`;
      console.log('folderPath', folderPath);
      // Ensure folder exists
      const folderInfo = await FileSystem.getInfoAsync(folderPath);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
      }
      console.log('folderInfo', folderInfo);

      // Check if already cached
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      console.log('fileInfo', fileInfo);
      if (fileInfo.exists) {
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      // Download and cache the photo
      const downloadResult = await FileSystem.downloadAsync(url, cachePath);
      console.log('downloadResult', downloadResult);
      if (downloadResult.status === 200) {
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }

      throw new Error('Failed to download photo');
    } catch (error) {
      console.error('Error caching photo:', error);
      throw error;
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
      console.error('Error cleaning up photo cache:', error);
    }
  }
}

export const photoService = new PhotoService(); 