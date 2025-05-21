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
│   ├── /(tabs)              # Tab-based navigation screens
│   │   ├── map.tsx         # Main map screen
│   │   ├── prayer.tsx      # Prayer screen
│   │   ├── profile.tsx     # User profile screen
│   │   └── _layout.tsx     # Tab navigation layout
│   ├── _layout.tsx         # Root layout
│   └── +not-found.tsx      # 404 page
├── /components             # Reusable UI components
├── /services              # Service integrations
├── /store                # State management
├── /hooks               # Custom React hooks
├── /constants           # App constants
└── /assets             # Static assets
```

## Navigation Structure

The app uses Expo Router for navigation, implementing a tab-based navigation system with the following structure:

- **Map Tab**: Main map interface for viewing and interacting with stupas
- **Prayer Tab**: Dedicated space for prayer-related features
- **Profile Tab**: User profile and settings

The navigation is implemented using the new Expo Router file-based routing system, which provides:
- Type-safe routing
- Deep linking support
- Automatic handling of navigation state
- Built-in 404 handling

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
  // Core
  "expo": "^49.x",
  "expo-router": "^2.x",
  "react-native": "0.72.x",
  "react": "18.2.0",
  
  // Navigation
  "@react-navigation/native": "^6.x",
  
  // State Management
  "@reduxjs/toolkit": "^1.x",
  
  // Storage
  "@react-native-async-storage/async-storage": "^1.x",
  
  // Firebase
  "firebase": "^10.x",
  "@react-native-firebase/app": "^18.x",
  "@react-native-firebase/auth": "^18.x",
  "@react-native-firebase/firestore": "^18.x",
  "@react-native-firebase/storage": "^18.x"
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