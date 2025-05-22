import { useState, useEffect } from 'react';
import { auth } from '@/services/firebase';
import { User } from '@/services/auth.service';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        const userData = userDoc.data() as Omit<User, 'id'>;
        setUser({
          id: firebaseUser.uid,
          ...userData,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
} 