# Stupa Map App - Video Integration Architecture

## Overview
The Video Integration system allows users to upload, view, and manage videos associated with stupas. Videos can be either uploaded directly or linked from external sources (YouTube, Vimeo). The system handles video processing, storage, and efficient playback.

## Components Architecture

### Component Hierarchy
```
VideoSection
├── VideoPlayer
│   ├── PlaybackControls
│   ├── ProgressBar
│   └── QualitySelector
├── VideoList
│   ├── VideoThumbnail
│   │   ├── Duration
│   │   └── UploadInfo
│   └── AddVideoButton
└── VideoUploader
    ├── SourceSelector
    │   ├── LocalUpload
    │   └── ExternalLink
    ├── ProcessingIndicator
    └── UploadProgress
```

## Data Model

### Firestore Collections

```typescript
// Video Collection
interface Video {
  id: string;
  stupaId: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Timestamp;
  
  // Video Source
  type: 'upload' | 'youtube' | 'vimeo';
  sourceUrl?: string;  // For external videos
  
  // For uploaded videos
  status: 'processing' | 'ready' | 'error';
  duration: number;
  thumbnailUrl: string;
  
  // Video variants (different qualities)
  variants: {
    [quality: string]: {
      url: string;
      width: number;
      height: number;
      bitrate: number;
    }
  };
  
  // Moderation
  isReported: boolean;
  reportCount: number;
}

// Video Processing Jobs
interface VideoProcessingJob {
  id: string;
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
}
```

## Key Features Implementation

### 1. Video Upload Flow

```typescript
// services/videoUploadService.ts
interface UploadVideoInput {
  stupaId: string;
  title: string;
  description?: string;
  file: File;
}

const uploadVideo = async (input: UploadVideoInput) => {
  // 1. Create video document
  const videoRef = firebase.firestore().collection('videos').doc();
  const videoDoc: Video = {
    id: videoRef.id,
    stupaId: input.stupaId,
    userId: firebase.auth().currentUser!.uid,
    title: input.title,
    description: input.description,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    type: 'upload',
    status: 'processing',
    duration: 0,
    thumbnailUrl: '',
    variants: {},
    isReported: false,
    reportCount: 0
  };
  
  // 2. Upload to Firebase Storage
  const videoPath = `videos/${videoRef.id}/original`;
  const storageRef = firebase.storage().ref(videoPath);
  
  // 3. Start upload with progress tracking
  const uploadTask = storageRef.put(input.file);
  
  uploadTask.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      // Update UI with progress
    },
    (error) => {
      // Handle unsuccessful upload
    },
    async () => {
      // Upload completed successfully
      const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
      
      // 4. Trigger video processing
      await firebase.functions().httpsCallable('processVideo')({
        videoId: videoRef.id,
        sourceUrl: downloadURL
      });
      
      // 5. Update video document
      await videoRef.set(videoDoc);
    }
  );
  
  return videoRef.id;
};
```

### 2. External Video Integration

```typescript
// services/externalVideoService.ts
interface AddExternalVideoInput {
  stupaId: string;
  title: string;
  description?: string;
  url: string;
}

const addExternalVideo = async (input: AddExternalVideoInput) => {
  // 1. Parse video URL and get provider
  const provider = getVideoProvider(input.url);
  if (!provider) throw new Error('Unsupported video provider');
  
  // 2. Fetch video metadata from provider
  const metadata = await fetchVideoMetadata(input.url);
  
  // 3. Create video document
  const videoRef = firebase.firestore().collection('videos').doc();
  const videoDoc: Video = {
    id: videoRef.id,
    stupaId: input.stupaId,
    userId: firebase.auth().currentUser!.uid,
    title: input.title || metadata.title,
    description: input.description || metadata.description,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    type: provider,
    sourceUrl: input.url,
    status: 'ready',
    duration: metadata.duration,
    thumbnailUrl: metadata.thumbnailUrl,
    variants: {},
    isReported: false,
    reportCount: 0
  };
  
  await videoRef.set(videoDoc);
  return videoRef.id;
};
```

### 3. Video Playback

```typescript
// hooks/useVideoPlayback.ts
const useVideoPlayback = (videoId: string) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection('videos')
      .doc(videoId)
      .onSnapshot(
        doc => {
          setVideo(doc.data() as Video);
          setLoading(false);
        },
        err => setError(err)
      );
      
    return () => unsubscribe();
  }, [videoId]);
  
  const getPlaybackUrl = (quality: string = 'auto') => {
    if (!video) return null;
    
    if (video.type !== 'upload') {
      return video.sourceUrl;
    }
    
    // For uploaded videos, select appropriate quality
    return video.variants[quality]?.url || 
           video.variants['720p']?.url ||  // fallback to 720p
           Object.values(video.variants)[0]?.url;  // or first available
  };
  
  return { video, loading, error, getPlaybackUrl };
};
```

## Cloud Functions

### Video Processing

```typescript
// functions/processVideo.ts
export const processVideo = functions.https.onCall(async (data, context) => {
  const { videoId, sourceUrl } = data;
  
  // 1. Download video from storage
  const tempFilePath = `/tmp/${videoId}`;
  await downloadFile(sourceUrl, tempFilePath);
  
  // 2. Generate thumbnails
  const thumbnail = await generateThumbnail(tempFilePath);
  const thumbnailUrl = await uploadThumbnail(thumbnail, videoId);
  
  // 3. Process video into different qualities
  const variants = await processVideoVariants(tempFilePath, videoId);
  
  // 4. Update video document
  await admin.firestore()
    .collection('videos')
    .doc(videoId)
    .update({
      status: 'ready',
      thumbnailUrl,
      variants,
      duration: await getVideoDuration(tempFilePath)
    });
    
  // 5. Cleanup
  await fs.unlink(tempFilePath);
});
```

## Performance Optimizations

### 1. Video Loading
- Adaptive bitrate streaming
- Quality selection based on network
- Preload next video in playlist
- Thumbnail caching

### 2. Upload Optimization
- Chunk uploads for large files
- Resume interrupted uploads
- Client-side video compression
- Background upload support

### 3. Playback Performance
- Progressive loading
- Buffer management
- Quality auto-switching
- Preload metadata

## Security Rules

### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{videoId}/{file} {
      allow read: if true;
      allow create: if request.auth != null && 
                   request.resource.size < 500 * 1024 * 1024 && // 500MB limit
                   request.resource.contentType.matches('video/.*');
      allow delete: if request.auth.uid == resource.metadata.userId;
    }
    
    match /thumbnails/{videoId} {
      allow read: if true;
    }
  }
}
```

### Firestore Rules
```
service cloud.firestore {
  match /databases/{database}/documents {
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## Error Handling

```typescript
// utils/videoErrorHandling.ts
const handleVideoError = (error: Error) => {
  switch (error.code) {
    case 'storage/unauthorized':
      // Handle permission errors
      break;
    case 'storage/quota-exceeded':
      // Handle storage quota errors
      break;
    case 'video/processing-failed':
      // Handle processing errors
      break;
    case 'video/unsupported-format':
      // Handle format errors
      break;
    default:
      // Handle other errors
  }
};
```

## Dependencies

```json
{
  "@react-native-community/blur": "^4.x",
  "react-native-video": "^5.x",
  "react-native-compressor": "^1.x",
  "@ffmpeg/ffmpeg": "^0.11.x",
  "react-native-background-upload": "^6.x"
}
```

## Getting Started

1. Set up Firebase Storage and configure CORS
2. Create video processing Cloud Functions
3. Implement basic video upload
4. Add video player component
5. Implement external video integration
6. Add video processing status monitoring
7. Implement playback optimizations
8. Add moderation features 