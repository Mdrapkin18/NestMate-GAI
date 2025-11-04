import { DataProvider, GetEntriesParams, WriteResult } from '../../core/ports/DataProvider';
// FIX: Use AnyEntry instead of Entry
import { AnyEntry, Baby, UserProfile } from '../../core/domain/types';
import { v4 as uuidv4 } from 'uuid';

export class MemoryDataProvider implements DataProvider {
  private users: Map<string, UserProfile> = new Map();
  private babies: Map<string, Baby> = new Map();
  // FIX: Use AnyEntry instead of Entry
  private entries: Map<string, AnyEntry> = new Map();

  // FIX: Implement listenToUserProfile
  listenToUserProfile(uid: string, onUpdate: (profile: UserProfile | null) => void): () => void {
    onUpdate(this.users.get(uid) || null);
    // In a real mock, you could implement a simple event emitter
    return () => {}; // Return dummy unsubscribe
  }

  // --- User Profile ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    return this.users.get(uid) || null;
  }
  async createUserProfile(uid: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    this.users.set(uid, { uid, ...data });
  }
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const existing = this.users.get(uid);
    if (existing) {
      this.users.set(uid, { ...existing, ...data });
    }
  }

  // --- Babies ---
  async getBaby(babyId: string): Promise<Baby | null> {
    return this.babies.get(babyId) || null;
  }
  async listBabies(familyId: string): Promise<Baby[]> {
    return Array.from(this.babies.values()).filter(b => b.familyId === familyId);
  }
  async createBaby(babyData: Omit<Baby, 'id'>): Promise<string> {
    const id = uuidv4();
    this.babies.set(id, { id, ...babyData });
    return id;
  }
  async updateBaby(babyId: string, data: Partial<Baby>): Promise<void> {
    const existing = this.babies.get(babyId);
    if (existing) {
      this.babies.set(babyId, { ...existing, ...data });
    }
  }

  // --- Entries ---
  async getEntry(entryId: string): Promise<AnyEntry | null> {
    return this.entries.get(entryId) || null;
  }
  async getEntries({ babyId, familyId, limit = 20 }: GetEntriesParams): Promise<{ entries: AnyEntry[]; nextCursor?: any }> {
    const all = Array.from(this.entries.values())
      .filter(e => e.babyId === babyId && e.familyId === familyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { entries: all.slice(0, limit) };
  }
  async createEntry(entryData: Omit<AnyEntry, 'id'>): Promise<WriteResult> {
    const id = uuidv4();
    this.entries.set(id, { id, ...entryData } as AnyEntry);
    return { status: 'success', id };
  }
  async updateEntry(entryId: string, data: Partial<AnyEntry>): Promise<WriteResult> {
    const existing = this.entries.get(entryId);
    if (existing) {
      this.entries.set(entryId, { ...existing, ...data } as AnyEntry);
      return { status: 'success', id: entryId };
    }
    return { status: 'error', message: 'Not found' };
  }
  async deleteEntry(entryId: string): Promise<WriteResult> {
    this.entries.delete(entryId);
    return { status: 'success', id: entryId };
  }

  // FIX: Implement restoreEntry
  async restoreEntry(entry: AnyEntry): Promise<WriteResult> {
      this.entries.set(entry.id, entry);
      return { status: 'success', id: entry.id };
  }
  
  listenToEntries(params: GetEntriesParams, onUpdate: (entries: AnyEntry[]) => void): () => void {
    // Mock listener - just returns current state once
    this.getEntries(params).then(({ entries }) => onUpdate(entries));
    // In a real mock, you could implement a simple event emitter
    return () => {}; // Return dummy unsubscribe
  }
}
