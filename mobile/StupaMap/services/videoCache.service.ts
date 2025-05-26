import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

class VideoCacheService {
  private cacheDirectory: string;
  private maxCacheSize: number = 500 * 1024 * 1024; // 500MB max cache size

  constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}video-cache/`;
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }
      await this.cleanupCache();
    } catch (error) {
      console.error('Error initializing video cache:', error);
    }
  }

  private async cleanupCache() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      let totalSize = 0;
      const fileInfos = await Promise.all(
        files.map(async (file) => {
          const info = await FileSystem.getInfoAsync(`${this.cacheDirectory}${file}`);
          return {
            name: file,
            size: info.size || 0,
            modificationTime: info.modificationTime || 0,
          };
        })
      );

      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);

      // Calculate total size
      totalSize = fileInfos.reduce((sum, file) => sum + file.size, 0);

      // Remove oldest files if cache is too large
      while (totalSize > this.maxCacheSize && fileInfos.length > 0) {
        const oldestFile = fileInfos.shift();
        if (oldestFile) {
          await FileSystem.deleteAsync(`${this.cacheDirectory}${oldestFile.name}`);
          totalSize -= oldestFile.size;
        }
      }
    } catch (error) {
      console.error('Error cleaning up video cache:', error);
    }
  }

  private getCacheKey(url: string): string {
    // Create a unique filename based on the URL
    return url.split('/').pop()?.split('?')[0] || '';
  }

  async getCachedVideoUri(url: string): Promise<string | null> {
    try {
        console.log('url', url);
        const cacheKey = this.getCacheKey(url); // e.g. 'video-cache/stupas/abc/123.mp4'
        const cachePath = `${this.cacheDirectory}${cacheKey}`;
        const stupaKey = url.split('%2F')[1];
        const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}`;
        // Make sure the folder exists
      
        const fileInfo = await FileSystem.getInfoAsync(cachePath);
      
        if (fileInfo.exists) {
          console.log('Using cached video file at', cachePath);
          return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
        }
      
        return null;
      
      } catch (error) {
        console.error('Error caching video:', error);
        return null;
      }      
  }

  async cacheVideo(url: string): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(url); // e.g., 'video-cache/stupas/abc/123.mp4'
      const cachePath = `${this.cacheDirectory}${cacheKey}`;
      const stupaKey = url.split('%2F')[1];
      const folderPath = `${cachePath.substring(0, cachePath.lastIndexOf('/'))}/stupas/${stupaKey}`;

      // Ensure folder exists
      const folderInfo = await FileSystem.getInfoAsync(folderPath);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
      }
      console.log('folderInfo', folderInfo);
  
      // Check if already cached
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }
      // Download and cache the video
      const downloadResult = await FileSystem.downloadAsync(url, cachePath);
      
      if (downloadResult.status === 200) {
        await this.cleanupCache(); // Optional: implement this to control cache size
        return Platform.OS === 'ios' ? cachePath : `file://${cachePath}`;
      }
  
      throw new Error('Failed to download video');
    } catch (error) {
      console.error('Error caching video:', error);
      throw error;
    }
  }
  
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      await this.initializeCache();
    } catch (error) {
      console.error('Error clearing video cache:', error);
    }
  }
}

export const videoCacheService = new VideoCacheService(); 