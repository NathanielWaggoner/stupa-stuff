import { firestore } from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export interface Prayer {
  id: string;
  stupaId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  isPrivate: boolean;
  isReported: boolean;
  reportCount: number;
}

export interface PrayerStats {
  totalPrayers: number;
  uniqueStupas: number;
  lastPrayerDate: Date | null;
}

class PrayerService {
  private prayersCollection = collection(firestore, 'prayers');
  private userPrayerStatsCollection = collection(firestore, 'userPrayerStats');

  async addPrayer(stupaId: string, text: string, isPrivate: boolean = false): Promise<string> {
    const { user } = useAuth();
    if (!user) throw new Error('User must be authenticated to add a prayer');

    const prayerRef = doc(this.prayersCollection);
    const prayer: Prayer = {
      id: prayerRef.id,
      stupaId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      text,
      createdAt: new Date(),
      isPrivate,
      isReported: false,
      reportCount: 0
    };

    await setDoc(prayerRef, prayer);

    // Update user prayer stats
    await this.updateUserPrayerStats(user.uid, stupaId);

    return prayerRef.id;
  }

  async getPrayersForStupa(stupaId: string, limit: number = 50): Promise<Prayer[]> {
    const q = query(
      this.prayersCollection,
      where('stupaId', '==', stupaId),
      where('isPrivate', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Prayer[];
  }

  async getUserPrayerStats(userId: string): Promise<PrayerStats> {
    const statsDoc = await getDoc(doc(this.userPrayerStatsCollection, userId));
    const stats = statsDoc.data();

    if (!stats) {
      return {
        totalPrayers: 0,
        uniqueStupas: 0,
        lastPrayerDate: null
      };
    }

    return {
      totalPrayers: stats.totalPrayers || 0,
      uniqueStupas: stats.uniqueStupas || 0,
      lastPrayerDate: stats.lastPrayerDate?.toDate() || null
    };
  }

  private async updateUserPrayerStats(userId: string, stupaId: string): Promise<void> {
    const statsRef = doc(this.userPrayerStatsCollection, userId);
    const statsDoc = await getDoc(statsRef);
    const stats = statsDoc.data() || {};

    const batch = writeBatch(firestore);

    // Update total prayers
    batch.update(statsRef, {
      totalPrayers: increment(1),
      lastPrayerDate: serverTimestamp()
    });

    // Update unique stupas if this is a new stupa for the user
    if (!stats.uniqueStupas || !stats.uniqueStupas.includes(stupaId)) {
      batch.update(statsRef, {
        uniqueStupas: arrayUnion(stupaId)
      });
    }

    await batch.commit();
  }

  async reportPrayer(prayerId: string, reason: string): Promise<void> {
    const { user } = useAuth();
    if (!user) throw new Error('User must be authenticated to report a prayer');

    const prayerRef = doc(this.prayersCollection, prayerId);
    const reportRef = doc(collection(prayerRef, 'reports'));

    const batch = writeBatch(firestore);

    // Add report
    batch.set(reportRef, {
      userId: user.uid,
      reason,
      createdAt: serverTimestamp()
    });

    // Update prayer report count
    batch.update(prayerRef, {
      reportCount: increment(1),
      isReported: true
    });

    await batch.commit();
  }

  subscribeToPrayersForStupa(stupaId: string, callback: (prayers: Prayer[]) => void) {
    const q = query(
      this.prayersCollection,
      where('stupaId', '==', stupaId),
      where('isPrivate', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, snapshot => {
      const prayers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Prayer[];
      callback(prayers);
    });
  }
}

export const prayerService = new PrayerService(); 