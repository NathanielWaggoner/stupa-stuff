import { auth, firestore } from './firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, collection } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  emailVerified: boolean;
}

class AuthService {
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // Update display name
      await updateProfile(user, { displayName });

      // Send verification email
      await sendEmailVerification(user);

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: user.email!,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: user.emailVerified
      };

      await setDoc(doc(firestore, 'users', user.uid), userData);

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
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Update last login time
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastLoginAt: new Date(),
        emailVerified: user.emailVerified
      });

      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
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
      await signOut(auth);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is currently signed in');
      await sendEmailVerification(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is currently signed in');
      if (!user.email) throw new Error('User has no email address');

      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore
      await deleteUser(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; photoURL?: string }
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Update Firebase Auth profile
      await updateProfile(user, data);

      // Update Firestore user document
      await updateDoc(doc(firestore, 'users', userId), data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
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
    console.error('Auth error:', error);
    return new Error(error.message || 'Authentication failed');
  }
}

export const authService = new AuthService(); 