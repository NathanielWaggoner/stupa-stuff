import { BaseMediaService } from './base-media.service';

class VideoService extends BaseMediaService {
  constructor() {
    super('video');
  }

  async uploadStupaVideo(stupaId: string, videoUri: string): Promise<string> {
    try {
      return await this.uploadMedia(stupaId, videoUri, 'videos');
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  async getCachedVideoUri(url: string): Promise<string | null> {
    return this.getCachedMediaUri(url);
  }

  async cacheVideo(url: string): Promise<string> {
    return this.cacheMedia(url);
  }
}

export const videoService = new VideoService(); 