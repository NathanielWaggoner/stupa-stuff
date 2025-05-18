import { firestore, auth } from './firebase';
import { User } from './auth.service';

export interface Prayer {
  id: string;
  stupaId: string;
  userId: string;
  text: string;
  createdAt: Date;
  language: string;
  isPrivate: boolean;
  isReported: boolean;
  reportCount: number;
}

export interface PrayerCount {
  stupaId: string;
  totalCount: number;
  lastPrayerAt: Date;
  shardId?: string;
  count?: number;
}

export interface UserPrayerStats {
  userId: string;
  totalPrayers: number;
  lastPrayerAt: Date;
  frequentStupas: {
    stupaId: string;
    count: number;
  }[];
}

class PrayerService {
  async offerPrayer(input: {
    stupaId: string;
    text?: string;
    isPrivate?: boolean;
    language?: string;
  }): Promise<Prayer> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not authenticated');

      const prayerData: Omit<Prayer, 'id'> = {
        stupaId: input.stupaId,
        userId: user.uid,
        text: input.text || '',
        createdAt: new Date(),
        language: input.language || 'en',
        isPrivate: input.isPrivate || false,
        isReported: false,
        reportCount: 0,
      };

      // Create prayer document
      const prayerRef = await firestore().collection('prayers').add(prayerData);

      // Update prayer count using distributed counter
      await this.incrementPrayerCount(input.stupaId);

      // Update user prayer stats
      await this.updateUserPrayerStats(user.uid, input.stupaId);

      return {
        id: prayerRef.id,
        ...prayerData,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPrayers(stupaId: string, limit = 50): Promise<Prayer[]> {
    try {
      const snapshot = await firestore()
        .collection('prayers')
        .where('stupaId', '==', stupaId)
        .where('isPrivate', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prayer[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const snapshot = await firestore()
        .collection('prayers')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prayer[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPrayerCount(stupaId: string): Promise<number> {
    try {
      const shards = await firestore()
        .collection('prayerCounts')
        .doc(stupaId)
        .collection('shards')
        .get();

      return shards.docs.reduce((total, shard) => total + shard.data().count, 0);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserPrayerStats(userId: string): Promise<UserPrayerStats> {
    try {
      const doc = await firestore()
        .collection('userPrayerStats')
        .doc(userId)
        .get();

      if (!doc.exists) {
        return {
          userId,
          totalPrayers: 0,
          lastPrayerAt: new Date(),
          frequentStupas: [],
        };
      }

      return doc.data() as UserPrayerStats;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async incrementPrayerCount(stupaId: string): Promise<void> {
    const shardId = Math.floor(Math.random() * 10).toString();
    const shardRef = firestore()
      .collection('prayerCounts')
      .doc(stupaId)
      .collection('shards')
      .doc(shardId);

    await firestore().runTransaction(async (transaction) => {
      const shard = await transaction.get(shardRef);
      if (!shard.exists) {
        transaction.set(shardRef, { count: 1 });
      } else {
        transaction.update(shardRef, {
          count: firestore.FieldValue.increment(1),
        });
      }
    });
  }

  private async updateUserPrayerStats(
    userId: string,
    stupaId: string
  ): Promise<void> {
    const statsRef = firestore().collection('userPrayerStats').doc(userId);

    await firestore().runTransaction(async (transaction) => {
      const stats = await transaction.get(statsRef);
      if (!stats.exists) {
        transaction.set(statsRef, {
          userId,
          totalPrayers: 1,
          lastPrayerAt: new Date(),
          frequentStupas: [{ stupaId, count: 1 }],
        });
      } else {
        const data = stats.data() as UserPrayerStats;
        const stupaIndex = data.frequentStupas.findIndex(
          (s) => s.stupaId === stupaId
        );

        if (stupaIndex >= 0) {
          data.frequentStupas[stupaIndex].count++;
        } else {
          data.frequentStupas.push({ stupaId, count: 1 });
        }

        // Sort by count and keep top 10
        data.frequentStupas.sort((a, b) => b.count - a.count);
        data.frequentStupas = data.frequentStupas.slice(0, 10);

        transaction.update(statsRef, {
          totalPrayers: firestore.FieldValue.increment(1),
          lastPrayerAt: new Date(),
          frequentStupas: data.frequentStupas,
        });
      }
    });
  }

  private handleError(error: any): Error {
    console.error('Prayer Service Error:', error);
    return new Error('Failed to process prayer request');
  }
}

export const prayerService = new PrayerService(); 