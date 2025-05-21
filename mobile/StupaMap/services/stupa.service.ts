import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from './firebase';
import { Stupa } from '@/store/slices/stupaSlice';

class StupaService {
  async getStupasInRegion(region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }): Promise<Stupa[]> {
    try {
      // Calculate bounding box
      const bbox = [
        region.longitude - region.longitudeDelta,
        region.latitude - region.latitudeDelta,
        region.longitude + region.longitudeDelta,
        region.latitude + region.latitudeDelta,
      ];

      // Query Firestore for stupas within the bounding box
      const stupasRef = collection(firestore, 'stupas');
      const q = query(
        stupasRef,
        where('location.latitude', '>=', bbox[1]),
        where('location.latitude', '<=', bbox[3])
      );

      const snapshot = await getDocs(q);

      // Filter results by longitude (Firestore can't query on multiple fields)
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Stupa))
        .filter(stupa => 
          stupa.location.longitude >= bbox[0] && 
          stupa.location.longitude <= bbox[2]
        );
    } catch (error) {
      console.error('Error fetching stupas:', error);
      throw new Error('Failed to fetch stupas');
    }
  }

  subscribeToStupasInRegion(
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    callback: (stupas: Stupa[]) => void
  ) {
    const bbox = [
      region.longitude - region.longitudeDelta,
      region.latitude - region.latitudeDelta,
      region.longitude + region.longitudeDelta,
      region.latitude + region.latitudeDelta,
    ];

    const stupasRef = collection(firestore, 'stupas');
    const q = query(
      stupasRef,
      where('location.latitude', '>=', bbox[1]),
      where('location.latitude', '<=', bbox[3])
    );

    return onSnapshot(q, (snapshot) => {
      const stupas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Stupa))
        .filter(stupa => 
          stupa.location.longitude >= bbox[0] && 
          stupa.location.longitude <= bbox[2]
        );
      callback(stupas);
    });
  }

  async addStupa(stupa: Omit<Stupa, 'id'>): Promise<Stupa> {
    try {
      const docRef = await addDoc(collection(firestore, 'stupas'), {
        ...stupa,
        location: new GeoPoint(stupa.location.latitude, stupa.location.longitude),
        createdAt: new Date().toISOString(),
        prayerCount: 0,
        lastPrayerAt: new Date().toISOString(),
      });

      return {
        id: docRef.id,
        ...stupa,
      };
    } catch (error) {
      console.error('Error adding stupa:', error);
      throw new Error('Failed to add stupa');
    }
  }

  async uploadStupaVideo(stupaId: string, videoUri: string): Promise<string> {
    try {
      const storageRef = ref(storage, `stupas/${stupaId}/${Date.now()}.mp4`);
      const response = await fetch(videoUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  async updateStupa(stupaId: string, data: Partial<Stupa>): Promise<void> {
    try {
      const stupaRef = doc(firestore, 'stupas', stupaId);
      await updateDoc(stupaRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating stupa:', error);
      throw new Error('Failed to update stupa');
    }
  }

  subscribeToStupa(stupaId: string, callback: (stupa: Stupa | null) => void) {
    const stupaRef = doc(firestore, 'stupas', stupaId);
    return onSnapshot(stupaRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Stupa);
      } else {
        callback(null);
      }
    });
  }

  async syncWithOSM(bbox: number[]): Promise<void> {
    try {
      // TODO: Implement OpenStreetMap sync logic
      // This will fetch stupa data from OSM API and sync with our database
    } catch (error) {
      console.error('Error syncing with OSM:', error);
      throw new Error('Failed to sync with OpenStreetMap');
    }
  }
}

export const stupaService = new StupaService(); 