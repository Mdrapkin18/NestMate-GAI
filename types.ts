export type FeedMode = 'breast' | 'bottle' | 'pump';
export type BreastSide = 'left' | 'right';
export type BottleType = 'breastmilk' | 'formula' | 'mixed';
export type SleepCategory = 'nap' | 'night';
export type ActiveTab = 'home' | 'feeding' | 'sleep' | 'history' | 'settings';


export interface Entry {
  id: string;
  type: 'feed' | 'sleep' | 'diaper';
  startedAt: number; // Unix timestamp (ms)
  endedAt?: number; // Unix timestamp (ms)
  notes?: string;
}

export interface FeedEntry extends Entry {
  type: 'feed';
  mode: FeedMode;
  side?: BreastSide;
  amountMl?: number;
  bottleType?: BottleType;
}

export interface SleepEntry extends Entry {
  type: 'sleep';
  category: SleepCategory;
}

export interface DiaperEntry extends Entry {
  type: 'diaper';
  wet: boolean;
  dirty: boolean;
}

export type AnyEntry = FeedEntry | SleepEntry | DiaperEntry;

export interface TimerState {
  id: string;
  type: 'feed' | 'sleep';
  startedAt: number;
  side?: BreastSide;
}

export interface Baby {
  name: string;
  dob: string; // YYYY-MM-DD
  weightKg?: number;
  heightCm?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}