import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  signInWithCredential,
  User,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { firestore } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  deletedAt?: Date;
}

class AuthService {
  private auth = getAuth();

  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await this.updateUserProfile(user.uid, {
        lastLoginAt: new Date()
      });

      return this.getUserProfile(user);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  async signInWithGoogle(idToken: string): Promise<UserProfile> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(this.auth, credential);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile
        await this.createUserProfile(user);
      } else {
        // Update last login time
        await this.updateUserProfile(user.uid, {
          lastLoginAt: new Date()
        });
      }

      return this.getUserProfile(user);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile
      await this.createUserProfile(user);

      return this.getUserProfile(user);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  async sendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      await sendEmailVerification(user);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, data, { merge: true });
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      // Reauthenticate user before deletion
      const credential = GoogleAuthProvider.credential(
        await user.getIdToken()
      );
      await signInWithCredential(this.auth, credential);
      
      // Delete user data from Firestore
      await this.updateUserProfile(user.uid, {
        deletedAt: new Date()
      });
      
      // Delete user account
      await deleteUser(user);
    } catch (error: any) {
      console.error('ERROR Auth error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  private async createUserProfile(user: User): Promise<void> {
    const userProfile: UserProfile = {
      id: user.uid,
      email: user.email!,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    await this.updateUserProfile(user.uid, userProfile);
  }

  private async getUserProfile(user: User): Promise<UserProfile> {
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    const userData = userDoc.data() as UserProfile;

    return {
      id: user.uid,
      email: user.email!,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: userData?.createdAt || new Date(),
      lastLoginAt: userData?.lastLoginAt || new Date()
    };
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(this.auth, callback);
  }
}

export const authService = new AuthService(); 