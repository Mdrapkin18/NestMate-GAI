import { Baby, UserProfile, AnyEntry } from '../domain/types';

export interface GetEntriesParams {
  babyId: string;
  familyId: string;
  limit?: number;
  startAfter?: any;
}

export type WriteResult = 
  | { status: 'success'; id: string }
  | { status: 'queued'; id: string }
  | { status: 'error'; message: string }
  // FIX: Use AnyEntry instead of Entry
  | { status: 'conflict'; keep: AnyEntry; merge: AnyEntry };

export interface DataProvider {
  // User Profile
  listenToUserProfile(uid: string, onUpdate: (profile: UserProfile | null) => void): () => void;
  
  // Babies
  getBaby(babyId: string): Promise<Baby | null>;
  listBabies(familyId: string): Promise<Baby[]>;
  createBaby(baby: Omit<Baby, 'id'>, userId: string): Promise<string>;
  updateBaby(babyId: string, data: Partial<Baby>): Promise<void>;

  // Entries
  getEntry(entryId: string): Promise<AnyEntry | null>;
  createEntry(entry: Omit<AnyEntry, 'id'>): Promise<WriteResult>;
  updateEntry(entryId: string, data: Partial<AnyEntry>): Promise<WriteResult>;
  deleteEntry(entryId: string): Promise<WriteResult>;
  restoreEntry(entry: AnyEntry): Promise<WriteResult>;

  // Listeners
  listenToEntries(params: GetEntriesParams, onUpdate: (entries: AnyEntry[]) => void): () => void;
}
