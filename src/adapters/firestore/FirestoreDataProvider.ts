import { DataProvider, GetEntriesParams, WriteResult } from '../../core/ports/DataProvider';
import { AnyEntry, Baby, UserProfile, anyEntrySchema, babySchema, userProfileSchema } from '../../core/domain/types';
import { db } from '../../../services/firebase';
import { z } from 'zod';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  deleteDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
  arrayUnion,
  getDocs,
} from 'firebase/firestore';
import { runMigrations } from '../../core/migrations';

// Helper to convert data for Firestore (e.g., remove undefined, use server timestamps)
const toFirestore = (data: Record<string, any>, isNew: boolean = false) => {
  const firestoreData: { [key: string]: any } = {};
  for (const key in data) {
    if (key === 'id') continue;
    if (data[key] !== undefined) {
      firestoreData[key] = data[key];
    }
  }
  if (isNew) {
    firestoreData.createdAt = serverTimestamp();
  }
  firestoreData.updatedAt = serverTimestamp();
  return firestoreData;
};

// Helper to parse data from Firestore, including schema validation and migration
const fromFirestore = <T>(schema: z.Schema<T>, id: string, data: any): T | null => {
    const upgradedData = runMigrations({ ...data, id });
    const parsed = schema.safeParse(upgradedData);
    if (parsed.success) {
        return parsed.data;
    }
    console.error(`[FirestoreAdapter] Zod validation failed for doc ${id}:`, parsed.error);
    return null;
}

export class FirestoreDataProvider implements DataProvider {
  // --- User Profile ---
  listenToUserProfile(uid: string, onUpdate: (profile: UserProfile | null) => void): () => void {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = fromFirestore(userProfileSchema, uid, docSnap.data());
        onUpdate(profile);
      } else {
        onUpdate(null);
      }
    });
  }

  // --- Babies ---
  async getBaby(babyId: string): Promise<Baby | null> {
    const docRef = doc(db, 'babies', babyId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return fromFirestore(babySchema, babyId, docSnap.data());
    }
    return null;
  }
  
  async listBabies(familyId: string): Promise<Baby[]> {
    const q = query(collection(db, 'babies'), where('familyId', '==', familyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => fromFirestore(babySchema, d.id, d.data())).filter(b => b !== null) as Baby[];
  }

  async createBaby(babyData: Omit<Baby, 'id'>, userId: string): Promise<string> {
    const batch = writeBatch(db);
    const babyRef = doc(collection(db, 'babies'));
    const userRef = doc(db, 'users', userId);

    batch.set(babyRef, toFirestore(babyData, true));
    batch.update(userRef, { babies: arrayUnion(babyRef.id) });
    
    await batch.commit();
    return babyRef.id;
  }
  
  async updateBaby(babyId: string, data: Partial<Baby>): Promise<void> {
     await updateDoc(doc(db, "babies", babyId), toFirestore(data));
  }
  
  // --- Entries ---
  async getEntry(entryId: string): Promise<AnyEntry | null> {
      const docSnap = await getDoc(doc(db, "entries", entryId));
      return docSnap.exists() ? fromFirestore(anyEntrySchema, entryId, docSnap.data()) : null;
  }
  
  async createEntry(entryData: Omit<AnyEntry, 'id'>): Promise<WriteResult> {
    try {
      const docRef = await addDoc(collection(db, 'entries'), toFirestore(entryData, true));
      return { status: 'success', id: docRef.id };
    } catch (e: any) {
        console.error("[FirestoreAdapter] createEntry failed:", e);
        return { status: 'error', message: e.message };
    }
  }

  async updateEntry(entryId: string, data: Partial<AnyEntry>): Promise<WriteResult> {
    try {
      const { id, ...updateData } = data; // Don't save id field
      await updateDoc(doc(db, "entries", entryId), toFirestore(updateData));
      return { status: 'success', id: entryId };
    } catch (e: any) {
       console.error(`[FirestoreAdapter] updateEntry ${entryId} failed:`, e);
       return { status: 'error', message: e.message };
    }
  }

  async deleteEntry(entryId: string): Promise<WriteResult> {
    try {
        await deleteDoc(doc(db, "entries", entryId));
        return { status: 'success', id: entryId };
    } catch (e: any) {
        console.error(`[FirestoreAdapter] deleteEntry ${entryId} failed:`, e);
        return { status: 'error', message: e.message };
    }
  }

  async restoreEntry(entry: AnyEntry): Promise<WriteResult> {
    try {
        const { id, ...data } = entry;
        await setDoc(doc(db, "entries", id), data);
        return { status: 'success', id };
    } catch (e: any) {
        console.error(`[FirestoreAdapter] restoreEntry ${entry.id} failed:`, e);
        return { status: 'error', message: e.message };
    }
  }

  listenToEntries(params: GetEntriesParams, onUpdate: (entries: AnyEntry[]) => void): () => void {
      const q = query(
        collection(db, "entries"),
        where("familyId", "==", params.familyId),
        where("babyId", "==", params.babyId),
        orderBy("startedAt", "desc"),
        limit(params.limit || 50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedEntries: AnyEntry[] = [];
        querySnapshot.forEach((doc) => {
            const parsedEntry = fromFirestore(anyEntrySchema, doc.id, doc.data());
            if (parsedEntry) {
              fetchedEntries.push(parsedEntry);
            }
        });
        onUpdate(fetchedEntries);
    }, (error) => {
        console.error("[FirestoreAdapter] listenToEntries error:", error);
    });

    return unsubscribe;
  }
}