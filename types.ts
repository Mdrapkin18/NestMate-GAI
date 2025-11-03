import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Zod custom preprocessor to handle Firestore Timestamps
const dateSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    // FIX: Explicitly cast `arg` to `Timestamp` to work around a potential environment issue
    // where the `instanceof` type guard is not correctly narrowing the type from `unknown`.
    return (arg as Timestamp).toDate();
  }
  return arg;
}, z.date());

// Base schema for all entries
const entrySchema = z.object({
  id: z.string(), // Firestore document ID
  babyId: z.string(),
  createdBy: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deviceId: z.string().optional(),
  note: z.string().optional(),
});

// Feeding Schemas
export const feedSchema = entrySchema.extend({
  kind: z.enum(['nursing', 'bottle', 'pump']),
  side: z.enum(['left', 'right']).optional(),
  amountOz: z.number().positive().optional(),
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  latch: z.boolean().optional(),
  pain: z.boolean().optional(),
});
export type Feed = z.infer<typeof feedSchema>;

// Sleep Schemas
export const sleepSchema = entrySchema.extend({
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  category: z.enum(['nap', 'night']),
  quality: z.enum(['good', 'ok', 'fussy']).optional(),
});
export type Sleep = z.infer<typeof sleepSchema>;

// Profile Schemas
export const babySchema = z.object({
  id: z.string(),
  familyId: z.string(),
  name: z.string(),
  dob: dateSchema,
  photoUrl: z.string().url().optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
});
export type Baby = z.infer<typeof babySchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  familyId: z.string().optional(),
  role: z.enum(['owner', 'editor', 'viewer', 'admin', 'caregiver']).optional(),
  babies: z.array(z.string()).optional(),
  fcmTokens: z.array(z.string()).optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// App State Types
export type ActiveTab = 'home' | 'feeding' | 'sleep' | 'history' | 'settings';

export interface TimerState {
  id: string;
  type: 'feed' | 'sleep';
  startedAt: number; // Storing as number for easier state management
  side?: 'left' | 'right';
}

export type AnyEntry = Feed | Sleep;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

// Old types for reference, to be deprecated
export type FeedMode = 'breast' | 'bottle' | 'pump';
export type BreastSide = 'left' | 'right';
export type BottleType = 'breastmilk' | 'formula' | 'mixed';
export type SleepCategory = 'nap' | 'night';

export interface OldEntry {
  id: string;
  type: 'feed' | 'sleep' | 'diaper';
  startedAt: number;
  endedAt?: number;
  notes?: string;
}