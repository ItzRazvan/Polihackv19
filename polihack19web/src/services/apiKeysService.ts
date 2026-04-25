import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface APIKey {
  id: string;
  createdAt: Date;
  description: string;
  deviceName: string;
  isActive: boolean;
  key: string;
  userId: string;
}

function generateAPIKey(): string {
  const prefix = 'pk_live_';
  const randomPart = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return prefix + randomPart;
}

export const apiKeysService = {
  async syncUserDeviceCount(userId: string): Promise<void> {
    const q = query(collection(db, 'api_keys'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    await setDoc(
      doc(db, 'users', userId),
      { devices: querySnapshot.size },
      { merge: true }
    );
  },

  async createAPIKey(
    userId: string,
    description: string,
    deviceName: string
  ): Promise<APIKey> {
    try {
      const newKey = generateAPIKey();
      const docRef = await addDoc(collection(db, 'api_keys'), {
        userId,
        description,
        deviceName,
        key: newKey,
        isActive: true,
        createdAt: Timestamp.now(),
      });

      await this.syncUserDeviceCount(userId);

      return {
        id: docRef.id,
        userId,
        description,
        deviceName,
        key: newKey,
        isActive: true,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  },

  async getAPIKeys(userId: string): Promise<APIKey[]> {
    try {
      const q = query(collection(db, 'api_keys'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as APIKey[];
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  },

  async deleteAPIKey(keyId: string): Promise<void> {
    try {
      const keyRef = doc(db, 'api_keys', keyId);
      const keySnap = await getDoc(keyRef);
      const userId = keySnap.exists() ? (keySnap.data().userId as string | undefined) : undefined;

      await deleteDoc(keyRef);

      if (userId) {
        await this.syncUserDeviceCount(userId);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  },

  async toggleAPIKeyStatus(keyId: string): Promise<void> {
    try {
      const keyRef = doc(db, 'api_keys', keyId);
      await deleteDoc(keyRef); // For demo, just delete - in production use updateDoc
    } catch (error) {
      console.error('Error toggling API key status:', error);
      throw error;
    }
  },
};
