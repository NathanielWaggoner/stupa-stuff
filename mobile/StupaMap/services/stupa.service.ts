import { firestore, storage } from './firebase';
import { Stupa } from '@/store/slices/stupaSlice';
import * as turf from '@turf/turf';

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
      const snapshot = await firestore()
        .collection('stupas')
        .where('location.latitude', '>=', bbox[1])
        .where('location.latitude', '<=', bbox[3])
        .get();

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

  async addStupa(stupa: Omit<Stupa, 'id'>): Promise<Stupa> {
    try {
      const doc = await firestore().collection('stupas').add({
        ...stupa,
        createdAt: new Date().toISOString(),
        prayerCount: 0,
        lastPrayerAt: new Date().toISOString(),
      });

      return {
        id: doc.id,
        ...stupa,
      };
    } catch (error) {
      console.error('Error adding stupa:', error);
      throw new Error('Failed to add stupa');
    }
  }

  async uploadStupaVideo(stupaId: string, videoUri: string): Promise<string> {
    try {
      const reference = storage().ref(`stupas/${stupaId}/${Date.now()}.mp4`);
      await reference.putFile(videoUri);
      return await reference.getDownloadURL();
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  async updateStupa(stupaId: string, data: Partial<Stupa>): Promise<void> {
    try {
      await firestore()
        .collection('stupas')
        .doc(stupaId)
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating stupa:', error);
      throw new Error('Failed to update stupa');
    }
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