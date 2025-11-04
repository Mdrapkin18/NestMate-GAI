import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// =================================
// Configuration & Versioning
// =================================

export const SCHEMA_VERSION = 2;

// =================================
// Primitives & Helpers
// =================================

const dateSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return (arg as Timestamp).toDate();
  }
  // Handle pending server timestamps which can appear as null
  if (arg === null || arg === undefined) {
    return new Date();
  }
  if (typeof arg === 'string' || typeof arg === 'number') {
    const date = new Date(arg);
    if (!isNaN(date.getTime())) return date;
  }
  return arg;
}, z.date());

// =================================
// Core Models
// =================================

export const familySchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  createdAt: dateSchema,
});
export type Family = z.infer<typeof familySchema>;

export const babySchema = z.object({
  id: z.string(),
  familyId: z.string(),
  name: z.string().min(1),
  dob: dateSchema,
  photoUrl: z.string().url().optional(),
  schemaVersion: z.number().optional(),
});
export type Baby = z.infer<typeof babySchema>;

// Base schema for all entries
const baseEntrySchema = z.object({
  id: z.string(),
  babyId: z.string(),
  familyId: z.string(),
  createdBy: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  note: z.string().optional(),
  schemaVersion: z.number().optional(),
});

// =================================
// Entry Type Schemas
// =================================

export const feedSchema = baseEntrySchema.extend({
  type: z.literal('feed'),
  kind: z.enum(['nursing', 'bottle']),
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  // Nursing-specific
  side: z.enum(['left', 'right']).optional(),
  sessionId: z.string().uuid().optional(), // For linking nursing sides
  // Bottle-specific
  amountOz: z.number().positive().optional(),
});
export type Feed = z.infer<typeof feedSchema>;

export const sleepSchema = baseEntrySchema.extend({
  type: z.literal('sleep'),
  startedAt: dateSchema,
  endedAt: dateSchema.optional(), // Can be ongoing
  category: z.enum(['nap', 'night']),
  quality: z.enum(['good', 'ok', 'fussy']).optional(),
});
export type Sleep = z.infer<typeof sleepSchema>;

export const pumpSchema = baseEntrySchema.extend({
  type: z.literal('pump'),
  // FIX: Add 'kind' property to align with the main application types.
  kind: z.literal('pump'),
  startedAt: dateSchema,
  endedAt: dateSchema.optional(),
  leftAmountOz: z.number().nonnegative().optional(),
  rightAmountOz: z.number().nonnegative().optional(),
  totalAmountOz: z.number().nonnegative().optional(),
});
export type Pump = z.infer<typeof pumpSchema>;

export const diaperSchema = baseEntrySchema.extend({
  type: z.literal('diaper'),
  startedAt: dateSchema,
  endedAt: dateSchema,
  diaperType: z.enum(['pee', 'poop', 'both']),
  rash: z.boolean().optional(),
  consistency: z.enum(['runny', 'mushy', 'soft', 'hard', 'solid']).optional(),
  color: z.enum(['yellow', 'brown', 'green', 'black', 'red']).optional(),
  volume: z.enum(['light', 'medium', 'heavy']).optional(),
});
export type Diaper = z.infer<typeof diaperSchema>;

export const bathSchema = baseEntrySchema.extend({
  type: z.literal('bath'),
  startedAt: dateSchema,
  endedAt: dateSchema,
  bathType: z.enum(['sponge', 'full']),
});
export type Bath = z.infer<typeof bathSchema>;


// Tagged union for any possible entry
export const anyEntrySchema = z.discriminatedUnion('type', [
  feedSchema,
  sleepSchema,
  pumpSchema,
  diaperSchema,
  bathSchema,
]);
export type AnyEntry = z.infer<typeof anyEntrySchema>;


// =================================
// User & Settings Models
// =================================

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  familyId: z.string().optional(),
  role: z.enum(['owner', 'editor', 'viewer', 'admin', 'caregiver']).optional(),
  babies: z.array(z.string()).optional(), // For quick access
  schemaVersion: z.number().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;


export const inviteSchema = z.object({
  id: z.string(), 
  familyId: z.string(),
  createdAt: dateSchema,
  expiresAt: dateSchema,
  createdBy: z.string(),
});
export type Invite = z.infer<typeof inviteSchema>;

// App State Types
export type ActiveTab = 'home' | 'history' | 'charts' | 'settings';

export interface TimerState {
  id: string;
  type: 'feed' | 'sleep' | 'pump';
  startedAt: number;
  side?: 'left' | 'right';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

// Old types to be removed
export type FeedMode = 'breast' | 'bottle' | 'pump';
export type BreastSide = 'left' | 'right';
export type BottleType = 'breastmilk' | 'formula' | 'mixed';