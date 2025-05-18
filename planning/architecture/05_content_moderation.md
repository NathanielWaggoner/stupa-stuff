# Stupa Map App - Content Moderation Architecture

## Overview
The Content Moderation system ensures the quality and appropriateness of user-generated content across the app, including stupa information, prayers, and videos. It combines automated moderation with user reporting and admin review capabilities.

## Components Architecture

### Component Hierarchy
```
ModeratorInterface
├── ReportedContentDashboard
│   ├── ContentQueue
│   │   ├── QueueFilters
│   │   └── QueueStats
│   └── ContentCard
│       ├── ContentPreview
│       ├── ReportInfo
│       └── ModeratorActions
└── ModeratorTools
    ├── UserManagement
    ├── ContentFilters
    └── AuditLog

UserReportingInterface
├── ReportButton
├── ReportForm
└── ReportStatus
```

## Data Model

### Firestore Collections

```typescript
// Reports Collection
interface Report {
  id: string;
  contentType: 'stupa' | 'prayer' | 'video';
  contentId: string;
  reportedBy: string;  // user ID
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;  // moderator ID
  action?: ModeratorAction;
}

// Report Reasons
type ReportReason = 
  | 'inappropriate'
  | 'spam'
  | 'offensive'
  | 'incorrect_information'
  | 'copyright_violation'
  | 'other';

// Moderator Actions
type ModeratorAction =
  | 'content_removed'
  | 'content_edited'
  | 'user_warned'
  | 'user_suspended'
  | 'no_action';

// Moderation Log
interface ModerationLog {
  id: string;
  moderatorId: string;
  contentType: 'stupa' | 'prayer' | 'video';
  contentId: string;
  action: ModeratorAction;
  reason: string;
  createdAt: Timestamp;
  previousState: any;  // Content state before moderation
  newState: any;      // Content state after moderation
}

// User Trust Score
interface UserTrustScore {
  userId: string;
  score: number;  // 0-100
  reportAccuracy: number;  // % of valid reports
  contentQuality: number;  // % of non-reported content
  lastUpdated: Timestamp;
  flags: {
    isTrusted: boolean;
    isWarned: boolean;
    isSuspended: boolean;
  }
}
```

## Key Features Implementation

### 1. User Reporting System

```typescript
// services/reportingService.ts
interface SubmitReportInput {
  contentType: 'stupa' | 'prayer' | 'video';
  contentId: string;
  reason: ReportReason;
  description?: string;
}

const submitReport = async (input: SubmitReportInput) => {
  const batch = firebase.firestore().batch();
  
  // Create report document
  const reportRef = firebase.firestore().collection('reports').doc();
  const report: Report = {
    id: reportRef.id,
    ...input,
    reportedBy: firebase.auth().currentUser!.uid,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  batch.set(reportRef, report);
  
  // Update content's report count
  const contentRef = firebase.firestore()
    .collection(input.contentType + 's')
    .doc(input.contentId);
    
  batch.update(contentRef, {
    reportCount: firebase.firestore.FieldValue.increment(1),
    isReported: true
  });
  
  await batch.commit();
  return reportRef.id;
};
```

### 2. Automated Moderation

```typescript
// functions/autoModeration.ts
export const moderateContent = functions.firestore
  .document('{contentType}/{contentId}')
  .onCreate(async (snap, context) => {
    const content = snap.data();
    const { contentType } = context.params;
    
    // 1. Text content moderation
    if (content.text || content.description) {
      const textModeration = await moderateText(content.text || content.description);
      if (textModeration.flagged) {
        await handleFlaggedContent(snap.ref, textModeration, contentType);
        return;
      }
    }
    
    // 2. Image/Video content moderation (if applicable)
    if (content.thumbnailUrl || content.imageUrl) {
      const mediaModeration = await moderateMedia(
        content.thumbnailUrl || content.imageUrl
      );
      if (mediaModeration.flagged) {
        await handleFlaggedContent(snap.ref, mediaModeration, contentType);
        return;
      }
    }
    
    // 3. Spam detection
    const spamScore = await detectSpam(content);
    if (spamScore > 0.8) {
      await handleSpamContent(snap.ref, spamScore, contentType);
    }
  });
```

### 3. Moderator Dashboard

```typescript
// hooks/useModerationQueue.ts
const useModerationQueue = (filters: QueueFilters) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let query = firebase.firestore()
      .collection('reports')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc');
      
    // Apply filters
    if (filters.contentType) {
      query = query.where('contentType', '==', filters.contentType);
    }
    if (filters.reason) {
      query = query.where('reason', '==', filters.reason);
    }
    
    const unsubscribe = query.onSnapshot(snapshot => {
      const newReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(newReports);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [filters]);
  
  return { reports, loading };
};
```

### 4. Trust Score System

```typescript
// services/trustScoreService.ts
const updateUserTrustScore = async (userId: string, event: TrustEvent) => {
  const userRef = firebase.firestore()
    .collection('userTrustScores')
    .doc(userId);
    
  const userScore = await userRef.get();
  const currentScore = userScore.data() || {
    score: 50,  // Default starting score
    reportAccuracy: 1,
    contentQuality: 1,
    flags: {
      isTrusted: false,
      isWarned: false,
      isSuspended: false
    }
  };
  
  const newScore = calculateNewScore(currentScore, event);
  
  // Update user trust score
  await userRef.set(newScore, { merge: true });
  
  // Apply automatic actions based on score
  if (newScore.score < 20) {
    await suspendUser(userId);
  } else if (newScore.score < 40) {
    await warnUser(userId);
  }
};
```

## Performance Optimizations

### 1. Report Queue Management
- Batch processing of reports
- Priority queue based on severity
- Caching of frequently accessed content
- Pagination of moderation queue

### 2. Automated Moderation
- Rate limiting for content checks
- Parallel processing of different content types
- Caching of moderation results
- Progressive content scanning

### 3. Trust Score Calculation
- Periodic batch updates
- Score caching
- Incremental updates
- Background processing

## Security Rules

```
service cloud.firestore {
  match /databases/{database}/documents {
    // Reports can be created by any authenticated user
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.reportedBy ||
        isModerator()
      );
      allow update: if isModerator();
    }
    
    // Moderation logs only accessible to moderators
    match /moderationLogs/{logId} {
      allow read, write: if isModerator();
    }
    
    // Trust scores readable by user and moderators
    match /userTrustScores/{userId} {
      allow read: if request.auth.uid == userId || isModerator();
      allow write: if isModerator();
    }
    
    function isModerator() {
      return request.auth.token.isModerator == true;
    }
  }
}
```

## Error Handling

```typescript
// utils/moderationErrorHandling.ts
const handleModerationError = (error: Error) => {
  switch (error.code) {
    case 'moderation/content-not-found':
      // Handle deleted content
      break;
    case 'moderation/service-unavailable':
      // Handle automated moderation service errors
      break;
    case 'moderation/rate-limit':
      // Handle rate limiting
      break;
    default:
      // Handle other errors
  }
};
```

## Dependencies

```json
{
  "@google-cloud/vision": "^3.x",
  "@google-cloud/language": "^5.x",
  "bad-words": "^3.x",
  "firebase-admin": "^11.x",
  "sharp": "^0.32.x"
}
```

## Getting Started

1. Set up Firebase Authentication custom claims for moderators
2. Configure automated moderation services
3. Create moderation queue interface
4. Implement report system
5. Set up trust score calculation
6. Add moderation logging
7. Configure notification system
8. Test moderation workflows

## Monitoring and Analytics

### Moderation Metrics
- Average response time
- Report resolution rate
- False positive rate
- User satisfaction rate
- Content removal rate

### Trust Score Analytics
- Distribution of user scores
- Report accuracy trends
- Content quality trends
- Suspension/warning rates

### System Health
- Queue length
- Processing times
- Error rates
- Service availability 