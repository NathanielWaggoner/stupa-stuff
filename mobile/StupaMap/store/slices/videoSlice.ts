import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VideoVariant {
  url: string;
  width: number;
  height: number;
  bitrate: number;
}

export interface Video {
  id: string;
  stupaId: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  type: 'upload' | 'youtube' | 'vimeo';
  sourceUrl?: string;
  status: 'processing' | 'ready' | 'error';
  duration: number;
  thumbnailUrl: string;
  variants: Record<string, VideoVariant>;
  isReported: boolean;
  reportCount: number;
}

interface VideoState {
  videos: Record<string, Video[]>; // Keyed by stupaId
  selectedVideo: Video | null;
  loading: boolean;
  error: string | null;
  uploadProgress: Record<string, number>; // Keyed by upload ID
}

const initialState: VideoState = {
  videos: {},
  selectedVideo: null,
  loading: false,
  error: null,
  uploadProgress: {},
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<{ stupaId: string; videos: Video[] }>) => {
      const { stupaId, videos } = action.payload;
      state.videos[stupaId] = videos;
    },
    setSelectedVideo: (state, action: PayloadAction<Video | null>) => {
      state.selectedVideo = action.payload;
    },
    addVideo: (state, action: PayloadAction<Video>) => {
      const { stupaId } = action.payload;
      if (!state.videos[stupaId]) {
        state.videos[stupaId] = [];
      }
      state.videos[stupaId].unshift(action.payload);
    },
    updateVideo: (state, action: PayloadAction<Video>) => {
      const { stupaId, id } = action.payload;
      const index = state.videos[stupaId]?.findIndex(v => v.id === id);
      if (index !== undefined && index !== -1) {
        state.videos[stupaId][index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<{ uploadId: string; progress: number }>) => {
      const { uploadId, progress } = action.payload;
      state.uploadProgress[uploadId] = progress;
    },
    reportVideo: (state, action: PayloadAction<{ stupaId: string; videoId: string }>) => {
      const { stupaId, videoId } = action.payload;
      const video = state.videos[stupaId]?.find(v => v.id === videoId);
      if (video) {
        video.isReported = true;
        video.reportCount += 1;
      }
    },
  },
});

export const {
  setVideos,
  setSelectedVideo,
  addVideo,
  updateVideo,
  setLoading,
  setError,
  setUploadProgress,
  reportVideo,
} = videoSlice.actions;

export default videoSlice.reducer; 