import { describe, it, expect } from 'vitest';
import { calculateDailyStats } from './index';
// FIX: Use AnyEntry instead of Entry
import { AnyEntry } from '../domain/types';

// Fixture data for testing
// FIX: Use AnyEntry instead of Entry and satisfy the type constraints
const MOCK_ENTRIES: AnyEntry[] = [
  // Day 1
  { type: 'feed', kind: 'nursing', side: 'left', startedAt: new Date('2025-10-26T08:00:00Z'), endedAt: new Date('2025-10-26T08:15:00Z'), id: '1', babyId: 'b1', familyId: 'f1', createdBy: 'u1', createdAt: new Date('2025-10-26T08:00:00Z'), updatedAt: new Date() },
  { type: 'feed', kind: 'bottle', amountOz: 4, startedAt: new Date('2025-10-26T11:00:00Z'), endedAt: new Date('2025-10-26T11:05:00Z'), id: '2', babyId: 'b1', familyId: 'f1', createdBy: 'u1', createdAt: new Date('2025-10-26T11:00:00Z'), updatedAt: new Date() },
  { type: 'sleep', category: 'nap', startedAt: new Date('2025-10-26T09:00:00Z'), endedAt: new Date('2025-10-26T10:30:00Z'), id: '3', babyId: 'b1', familyId: 'f1', createdBy: 'u1', createdAt: new Date('2025-10-26T09:00:00Z'), updatedAt: new Date() },
  // Day 2
  { type: 'feed', kind: 'nursing', side: 'right', startedAt: new Date('2025-10-27T07:00:00Z'), endedAt: new Date('2025-10-27T07:20:00Z'), id: '4', babyId: 'b1', familyId: 'f1', createdBy: 'u1', createdAt: new Date('2025-10-27T07:00:00Z'), updatedAt: new Date() },
];

describe('Stats Engine', () => {
  it('should correctly calculate daily stats for a given timezone', () => {
    const stats = calculateDailyStats(MOCK_ENTRIES, 'UTC');
    
    expect(stats.size).toBe(2);

    const day1Stats = stats.get('2025-10-26');
    expect(day1Stats).toBeDefined();
    expect(day1Stats?.totalNursingMinutes).toBe(15);
    expect(day1Stats?.leftSideMinutes).toBe(15);
    expect(day1Stats?.totalBottleOz).toBe(4);
    expect(day1Stats?.totalSleepMinutes).toBe(90);
    expect(day1Stats?.longestSleepStretchMinutes).toBe(90);

    const day2Stats = stats.get('2025-10-27');
    expect(day2Stats).toBeDefined();
    expect(day2Stats?.totalNursingMinutes).toBe(20);
    expect(day2Stats?.rightSideMinutes).toBe(20);
    expect(day2Stats?.totalBottleOz).toBe(0);
  });
});
