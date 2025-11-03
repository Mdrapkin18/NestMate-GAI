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
  familyId: z.string(),
  createdBy: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deviceId: z.string().optional(),
  note: z.string().optional(),
});

// Feeding Schemas
export const feedSchema = entrySchema.extend({
  kind: z.enum(['nursing', 'bottle']),
  side: z.enum(['left', 'right']).optional(),
  amountOz: z.number().positive().optional(),
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  latch: z.boolean().optional(),
  pain: z.boolean().optional(),
});
export type Feed = z.infer<typeof feedSchema>;

// Pump Schemas
export const pumpSchema = entrySchema.extend({
    kind: z.literal('pump'),
    leftAmountOz: z.number().nonnegative().optional(),
    rightAmountOz: z.number().nonnegative().optional(),
    totalAmountOz: z.number().nonnegative().optional(),
    startedAt: dateSchema,
    endedAt: dateSchema.optional(),
});
export type Pump = z.infer<typeof pumpSchema>;


// Sleep Schemas
export const sleepSchema = entrySchema.extend({
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  category: z.enum(['nap', 'night']),
  quality: z.enum(['good', 'ok', 'fussy']).optional(),
});
export type Sleep = z.infer<typeof sleepSchema>;

// Diaper Schemas
export const diaperSchema = entrySchema.extend({
  type: z.enum(['pee', 'poop', 'both']),
  startedAt: dateSchema, // Represents the time of the change
  endedAt: dateSchema, // Same as startedAt for an instantaneous event
  rash: z.boolean().optional(),
  consistency: z.enum(['runny', 'mushy', 'soft', 'hard', 'solid']).optional(),
  color: z.enum(['yellow', 'brown', 'green', 'black', 'red']).optional(),
  volume: z.enum(['light', 'medium', 'heavy']).optional(),
});
export type Diaper = z.infer<typeof diaperSchema>;

// Bath Schemas
export const bathSchema = entrySchema.extend({
  bathType: z.enum(['sponge', 'full']),
  startedAt: dateSchema, // Represents the time of the bath
  endedAt: dateSchema, // Same as startedAt for an instantaneous event
});
export type Bath = z.infer<typeof bathSchema>;


// Profile Schemas
export const babySchema = z.object({
  id: z.string(),
  familyId: z.string(),
  name: z.string(),
  dob: dateSchema,
  photoUrl: z.string().url().optional(),
  weightLbs: z.number().nonnegative().optional(),
  weightOz: z.number().nonnegative().max(15.999).optional(),
  heightInches: z.number().nonnegative().optional(),
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

export const inviteSchema = z.object({
  id: z.string(), // The invite code itself
  familyId: z.string(),
  createdAt: dateSchema,
  expiresAt: dateSchema,
  createdBy: z.string(),
});
export type Invite = z.infer<typeof inviteSchema>;

// App State Types
export type ActiveTab = 'home' | 'feeding' | 'sleep' | 'history' | 'settings';

export interface TimerState {
  id: string;
  type: 'feed' | 'sleep' | 'pump';
  startedAt: number; // Storing as number for easier state management
  side?: 'left' | 'right';
}

export type AnyEntry = Feed | Sleep | Diaper | Bath | Pump;

export interface ChatMessage {
  id: string;
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