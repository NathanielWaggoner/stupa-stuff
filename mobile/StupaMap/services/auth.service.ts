import { auth, firestore } from './firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
}

class AuthService {
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { user } = userCredential;

      // Update display name
      await user.updateProfile({ displayName });

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: user.email!,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      await firestore().collection('users').doc(user.uid).set(userData);

      return {
        id: user.uid,
        ...userData,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { user } = await auth().signInWithEmailAndPassword(email, password);

      // Update last login time
      await firestore().collection('users').doc(user.uid).update({
        lastLoginAt: new Date(),
      });

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data() as Omit<User, 'id'>;

      return {
        id: user.uid,
        ...userData,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; photoURL?: string }
  ): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not authenticated');

      // Update Firebase Auth profile
      await user.updateProfile(data);

      // Update Firestore user document
      await firestore().collection('users').doc(userId).update(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get();
        const userData = userDoc.data() as Omit<User, 'id'>;
        callback({
          id: firebaseUser.uid,
          ...userData,
        });
      } else {
        callback(null);
      }
    });
  }

  private handleError(error: any): Error {
    if (error.code === 'auth/email-already-in-use') {
      return new Error('Email already registered');
    }
    if (error.code === 'auth/invalid-email') {
      return new Error('Invalid email address');
    }
    if (error.code === 'auth/operation-not-allowed') {
      return new Error('Operation not allowed');
    }
    if (error.code === 'auth/weak-password') {
      return new Error('Password is too weak');
    }
    if (error.code === 'auth/user-disabled') {
      return new Error('User account has been disabled');
    }
    if (error.code === 'auth/user-not-found') {
      return new Error('User not found');
    }
    if (error.code === 'auth/wrong-password') {
      return new Error('Invalid password');
    }
    return error;
  }
}

export const authService = new AuthService(); 