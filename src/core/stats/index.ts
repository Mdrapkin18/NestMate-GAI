// FIX: Use AnyEntry instead of Entry
import { AnyEntry, Feed, Sleep } from '../domain/types';

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalNursingMinutes: number;
  leftSideMinutes: number;
  rightSideMinutes: number;
  totalBottleOz: number;
  totalSleepMinutes: number;
  longestSleepStretchMinutes: number;
}

// FIX: Use AnyEntry instead of Entry
export function calculateDailyStats(entries: AnyEntry[], timezone: string): Map<string, DailyStats> {
  const dailyMap = new Map<string, { feeds: Feed[], sleeps: Sleep[] }>();

  // Group entries by day in the specified timezone
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
    if (!dailyMap.has(key)) {
      dailyMap.set(key, { feeds: [], sleeps: [] });
    }
    if (entry.type === 'feed') dailyMap.get(key)!.feeds.push(entry);
    if (entry.type === 'sleep') dailyMap.get(key)!.sleeps.push(entry as Sleep);
  }
  
  const result = new Map<string, DailyStats>();
  for (const [date, { feeds, sleeps }] of dailyMap.entries()) {
    const stats: DailyStats = {
      date,
      totalNursingMinutes: 0,
      leftSideMinutes: 0,
      rightSideMinutes: 0,
      totalBottleOz: 0,
      totalSleepMinutes: 0,
      longestSleepStretchMinutes: 0,
    };

    for (const feed of feeds) {
      if (feed.kind === 'nursing' && feed.endedAt) {
        const duration = (feed.endedAt.getTime() - feed.startedAt.getTime()) / (1000 * 60);
        stats.totalNursingMinutes += duration;
        if (feed.side === 'left') stats.leftSideMinutes += duration;
        if (feed.side === 'right') stats.rightSideMinutes += duration;
      } else if (feed.kind === 'bottle') {
        stats.totalBottleOz += feed.amountOz || 0;
      }
    }
    
    let longestSleep = 0;
    for (const sleep of sleeps) {
        if (sleep.endedAt) {
            const duration = (sleep.endedAt.getTime() - sleep.startedAt.getTime()) / (1000 * 60);
            stats.totalSleepMinutes += duration;
            if (duration > longestSleep) longestSleep = duration;
        }
    }
    stats.longestSleepStretchMinutes = longestSleep;

    result.set(date, stats);
  }

  return result;
}

// TODO: Implement WHO growth percentile calculations using JSON data.
// export function calculateGrowthPercentile(...) {}
