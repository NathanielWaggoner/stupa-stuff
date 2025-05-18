# Stupa Map App - Core Infrastructure Architecture

## Overview
This document outlines the core infrastructure using Firebase as our backend service. This serverless approach eliminates the need for managing custom servers while providing all necessary features including authentication, real-time database, and file storage.

## Technology Stack

### Frontend (Mobile)
- **Primary Framework**: React Native
  - Cross-platform support (iOS/Android)
  - Extensive ecosystem
  - Strong performance for map-based applications
  - Large developer community

- **Key Libraries**:
  - `@react-navigation`: Application routing
  - `@reduxjs/toolkit`: State management
  - `@react-native-async-storage`: Local storage
  - `expo`: Development and deployment tooling

### Backend (Firebase)
- **Firebase Authentication**
  - Built-in email/password authentication
  - Social auth providers (Google, Facebook, etc.)
  - Secure token management
  - User management dashboard

- **Cloud Firestore**
  - NoSQL database
  - Real-time updates
  - Automatic scaling
  - Offline data persistence
  - Geospatial queries support

- **Firebase Storage**
  - Video/image storage
  - Secure file uploads
  - CDN distribution

- **Firebase Cloud Functions** (optional)
  - Serverless compute
  - API endpoints if needed
  - Background tasks

## Project Structure

```
/src
├── /app
│   ├── /components           # Reusable UI components
│   ├── /screens             # Screen components
│   ├── /navigation          # Navigation configuration
│   ├── /services           
│   │   ├── firebase.ts      # Firebase configuration
│   │   ├── auth.service.ts  # Auth methods
│   │   └── storage.service.ts
│   ├── /store              # Redux store
│   │   ├── /slices
│   │   └── store.ts
│   └── /types              # TypeScript definitions
└── App.tsx                 # Root component
```

## Data Model

### Firestore Collections

```typescript
// Users Collection
interface User {
  id: string;              // Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// User Settings Collection
interface UserSettings {
  userId: string;
  preferences: {
    notifications: boolean;
    language: string;
  }
}
```

## Authentication System

### Authentication Flows

1. **Registration/Login**
   - Handled by Firebase Authentication
   - Multiple auth providers supported
   - Automatic session management
   - Secure token handling

2. **User Management**
   - Password reset
   - Email verification
   - Profile updates
   - Account deletion

## Security Rules

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // User settings
    match /userSettings/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Storage Security Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

## Performance Considerations

### Offline Support
- Firestore offline persistence
- Local data caching
- Background sync

### Data Access Patterns
- Pagination for large lists
- Compound queries optimization
- Index management

## Development Workflow

### Environment Setup
- Firebase project setup
  - Development
  - Production
- Environment configuration
- API key management

### Testing
- Firebase Local Emulator Suite
- Jest for unit testing
- React Native Testing Library

## Dependencies

```json
{
  // React Native core
  "@react-navigation/native": "^6.x",
  "@reduxjs/toolkit": "^1.x",
  "@react-native-async-storage/async-storage": "^1.x",
  "expo": "^48.x",
  
  // Firebase
  "firebase": "^9.x",
  "@react-native-firebase/app": "^17.x",
  "@react-native-firebase/auth": "^17.x",
  "@react-native-firebase/firestore": "^17.x",
  "@react-native-firebase/storage": "^17.x"
}
```

## Benefits of This Approach

1. **Zero Backend Maintenance**
   - No server management
   - Automatic scaling
   - Built-in security
   - Managed database

2. **Cost Effective**
   - Pay-as-you-go pricing
   - Generous free tier
   - No upfront infrastructure costs

3. **Rapid Development**
   - Pre-built authentication
   - Real-time data sync
   - Built-in offline support
   - Simple deployment

4. **Security**
   - Industry-standard authentication
   - Declarative security rules
   - Automatic SSL/TLS
   - DDoS protection

## Getting Started

1. Create a Firebase project
2. Enable required services:
   - Authentication
   - Firestore
   - Storage
3. Add Firebase configuration to the app
4. Set up security rules
5. Implement authentication flow
6. Begin building features

## Monitoring

- Firebase Console dashboard
- Crashlytics for error tracking
- Performance monitoring
- Usage statistics
- Cost monitoring 