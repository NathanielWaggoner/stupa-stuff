# Stupa Map App - Prayer System Architecture

## Overview
The Prayer System allows users to engage spiritually with stupas by offering prayers, viewing prayer counts, and sharing prayer texts. This feature supports both real-time interactions and offline capabilities.

## Components Architecture

### Component Hierarchy
```
PrayerSection
├── PrayerCounter
│   ├── CountDisplay
│   └── OfferPrayerButton
├── PrayerList
│   ├── PrayerItem
│   │   ├── PrayerText
│   │   ├── UserInfo
│   │   └── Timestamp
│   └── AddPrayerForm
└── PrayerStats
    └── RecentActivityIndicator
```

## Data Model

### Firestore Collections

```typescript
// Prayer Collection
interface Prayer {
  id: string;
  stupaId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  language: string;
  isPrivate: boolean;
  // For moderation
  isReported: boolean;
  reportCount: number;
}

// Prayer Count Collection (for efficient counter updates)
interface PrayerCount {
  stupaId: string;
  totalCount: number;
  lastPrayerAt: Timestamp;
  // Sharding for high-traffic stupas
  shardId?: string;
  count?: number;
}

// User Prayer Stats
interface UserPrayerStats {
  userId: string;
  totalPrayers: number;
  lastPrayerAt: Timestamp;
  frequentStupas: {
    stupaId: string;
    count: number;
  }[];
}
```

## Key Features Implementation

### 1. Offering a Prayer

```typescript
// services/prayerService.ts
interface OfferPrayerInput {
  stupaId: string;
  text?: string;
  isPrivate?: boolean;
}

const offerPrayer = async (input: OfferPrayerInput) => {
  const batch = firebase.firestore().batch();
  
  // Add prayer document if text is provided
  if (input.text) {
    const prayerRef = firebase.firestore().collection('prayers').doc();
    batch.set(prayerRef, {
      ...input,
      userId: firebase.auth().currentUser?.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isReported: false,
      reportCount: 0
    });
  }
  
  // Update prayer count using distributed counter pattern
  const shardId = Math.floor(Math.random() * 10).toString();
  const counterRef = firebase.firestore()
    .collection('prayerCounts')
    .doc(input.stupaId)
    .collection('shards')
    .doc(shardId);
    
  batch.set(counterRef, {
    count: firebase.firestore.FieldValue.increment(1),
    lastPrayerAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Update user stats
  const userStatsRef = firebase.firestore()
    .collection('userPrayerStats')
    .doc(firebase.auth().currentUser?.uid);
    
  batch.set(userStatsRef, {
    totalPrayers: firebase.firestore.FieldValue.increment(1),
    lastPrayerAt: firebase.firestore.FieldValue.serverTimestamp(),
    [`frequentStupas.${input.stupaId}`]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true });
  
  await batch.commit();
};
```

### 2. Real-time Prayer Feed

```typescript
// hooks/usePrayerFeed.ts
const usePrayerFeed = (stupaId: string) => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection('prayers')
      .where('stupaId', '==', stupaId)
      .where('isPrivate', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const newPrayers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPrayers(newPrayers);
        setLoading(false);
      });
      
    return () => unsubscribe();
  }, [stupaId]);
  
  return { prayers, loading };
};
```

### 3. Prayer Counter Implementation

```typescript
// services/counterService.ts
const getPrayerCount = async (stupaId: string): Promise<number> => {
  const shards = await firebase.firestore()
    .collection('prayerCounts')
    .doc(stupaId)
    .collection('shards')
    .get();
    
  return shards.docs.reduce((total, shard) => total + shard.data().count, 0);
};

// For real-time updates
const subscribeToPrayerCount = (stupaId: string, onChange: (count: number) => void) => {
  return firebase.firestore()
    .collection('prayerCounts')
    .doc(stupaId)
    .collection('shards')
    .onSnapshot(snapshot => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().count, 0);
      onChange(total);
    });
};
```

## Performance Optimizations

### 1. Distributed Counters
- Implement sharded counters for high-traffic stupas
- Use multiple counter shards to prevent contention
- Aggregate counts on read

### 2. Prayer List Performance
- Pagination for prayer lists
- Virtualized list rendering
- Optimistic UI updates
- Cache frequently accessed prayers

### 3. Offline Support
```typescript
// services/offlinePrayerSync.ts
interface PendingPrayer {
  stupaId: string;
  text?: string;
  createdAt: number;
}

const syncPendingPrayers = async () => {
  const pendingPrayers = await AsyncStorage.getItem('pendingPrayers');
  if (pendingPrayers) {
    const prayers: PendingPrayer[] = JSON.parse(pendingPrayers);
    for (const prayer of prayers) {
      await offerPrayer({
        stupaId: prayer.stupaId,
        text: prayer.text
      });
    }
    await AsyncStorage.removeItem('pendingPrayers');
  }
};
```

## State Management

### Redux Slice
```typescript
// store/slices/prayerSlice.ts
interface PrayerState {
  prayersByStupa: Record<string, Prayer[]>;
  counters: Record<string, number>;
  pendingPrayers: PendingPrayer[];
  isSubmitting: boolean;
  error: string | null;
}

const prayerSlice = createSlice({
  name: 'prayer',
  initialState,
  reducers: {
    addPrayer: (state, action) => {
      // Optimistically update UI
      state.prayersByStupa[action.payload.stupaId].unshift(action.payload);
      state.counters[action.payload.stupaId]++;
    },
    setPrayerCount: (state, action) => {
      state.counters[action.payload.stupaId] = action.payload.count;
    },
    // ... other reducers
  }
});
```

## Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prayers/{prayerId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    match /prayerCounts/{stupaId}/shards/{shardId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /userPrayerStats/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## Error Handling

```typescript
// utils/prayerErrorHandling.ts
const handlePrayerError = (error: Error) => {
  switch (error.code) {
    case 'permission-denied':
      // Handle authentication errors
      break;
    case 'resource-exhausted':
      // Handle rate limiting
      break;
    case 'unavailable':
      // Store prayer locally for later sync
      break;
    default:
      // Handle other errors
  }
};
```

## Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^1.x",
  "date-fns": "^2.x",
  "react-native-reanimated": "^2.x",
  "react-native-gesture-handler": "^2.x"
}
```

## Getting Started

1. Set up Firestore collections and indexes
2. Implement distributed counter system
3. Create basic prayer UI components
4. Add offline support
5. Implement real-time updates
6. Add prayer moderation features
7. Test with high-volume scenarios 