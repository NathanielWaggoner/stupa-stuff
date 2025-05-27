import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { BaseMediaService, MediaCompressionOptions } from './base-media.service';

interface PhotoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

class PhotoService extends BaseMediaService {
  constructor() {
    super('photo');
  }

  private async compressPhoto(uri: string, options: MediaCompressionOptions = {}): Promise<string> {
    try {
      const compressionOptions = {
        ...this.defaultCompressionOptions,
        ...options,
      };

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: compressionOptions.maxWidth,
              height: compressionOptions.maxHeight,
            },
          },
        ],
        {
          compress: compressionOptions.quality,
          format: compressionOptions.format === 'png' 
            ? ImageManipulator.SaveFormat.PNG 
            : ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing photo:', error);
      throw new Error('Failed to compress photo');
    }
  }

  async uploadStupaPhoto(stupaId: string, photoUri: string, compressionOptions?: MediaCompressionOptions): Promise<string> {
    try {
      // Compress the photo before upload
      const compressedUri = await this.compressPhoto(photoUri, compressionOptions);
      return await this.uploadMedia(stupaId, compressedUri, 'photos');
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  async getCachedPhotoUri(url: string): Promise<string | null> {
    return this.getCachedMediaUri(url);
  }

  async cachePhoto(url: string): Promise<string> {
    return this.cacheMedia(url);
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