import { z } from 'zod';

// Base schema for all entries
const entrySchema = z.object({
  id: z.string().uuid(),
  babyId: z.string().uuid(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deviceId: z.string().optional(),
  note: z.string().optional(),
});

// Feeding Schemas
export const feedSchema = entrySchema.extend({
  kind: z.enum(['nursing', 'bottle', 'pump']),
  side: z.enum(['left', 'right']).optional(),
  amountOz: z.number().positive().optional(),
  startedAt: z.date(),
  endedAt: z.date().optional(),
  latch: z.enum(['good', 'fair', 'poor']).optional(),
  pain: z.number().min(0).max(10).optional(),
});
export type Feed = z.infer<typeof feedSchema>;

// Sleep Schemas
export const sleepSchema = entrySchema.extend({
  startedAt: z.date(),
  endedAt: z.date().optional(),
  category: z.enum(['nap', 'night']),
  quality: z.enum(['good', 'ok', 'fussy']).optional(),
});
export type Sleep = z.infer<typeof sleepSchema>;

// Profile Schemas
export const babySchema = z.object({
  id: z.string().uuid(),
  familyId: z.string(),
  name: z.string(),
  dob: z.date(),
  photoUrl: z.string().url().optional(),
  // Fix: Add optional weight and height to match profile fields
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
});
export type Baby = z.infer<typeof babySchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  familyId: z.string().optional(),
  role: z.enum(['owner', 'editor', 'viewer']).optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// App State Types
export type ActiveTab = 'home' | 'feeding' | 'sleep' | 'history' | 'settings';

export interface TimerState {
  id: string;
  type: 'feed' | 'sleep';
  startedAt: number; // Storing as number for easier localStorage serialization
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