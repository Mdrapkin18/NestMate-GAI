import { AnyEntry, Diaper, Feed, Pump, Sleep } from "../types";

export type DateRange = 7 | 30 | 90;

// Feeding
export interface DailyFeedStats {
    date: string;
    bottleAmountOz: number;
    nursingDurationMins: number;
}
export interface NursingBreakdown {
    leftMins: number;
    rightMins: number;
}
export interface FeedingStats {
    totalFeeds: number;
    avgFeedsPerDay: number;
    totalBottleOz: number;
    totalNursingMins: number;
    nursingBreakdown: NursingBreakdown;
    dailyChartData: DailyFeedStats[];
}

// Sleep
export interface DailySleepStats {
    date: string;
    totalSleepMins: number;
}
export interface SleepStats {
    totalSleepMins: number;
    avgSleepPerDayMins: number;
    longestSleepMins: number;
    dailyChartData: DailySleepStats[];
}

// Pumping
export interface DailyPumpStats {
    date: string;
    totalAmountOz: number;
}
export interface PumpStats {
    totalPumpedOz: number;
    avgPumpedPerDayOz: number;
    dailyChartData: DailyPumpStats[];
}

// Diapers
export interface DailyDiaperStats {
    date: string;
    pee: number;
    poop: number;
    both: number;
}
export interface DiaperStats {
    totalChanges: number;
    avgChangesPerDay: number;
    dailyChartData: DailyDiaperStats[];
}


const getDaysInRange = (range: DateRange): string[] => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < range; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates.reverse();
};

export const processStatsData = (entries: AnyEntry[], range: DateRange): { feeding: FeedingStats, sleep: SleepStats, pump: PumpStats, diaper: DiaperStats } => {
    const feeds = entries.filter(e => e.type === 'feed') as Feed[];
    const sleeps = entries.filter(e => e.type === 'sleep') as Sleep[];
    const pumps = entries.filter(e => e.type === 'pump') as Pump[];
    const diapers = entries.filter(e => e.type === 'diaper') as Diaper[];

    const days = getDaysInRange(range);
    const dailyDataMap = new Map<string, {
        feeds: Feed[],
        sleeps: Sleep[],
        pumps: Pump[],
        diapers: Diaper[],
    }>();

    for(const day of days) {
        dailyDataMap.set(day, { feeds: [], sleeps: [], pumps: [], diapers: [] });
    }

    for (const feed of feeds) {
        const day = feed.startedAt.toISOString().split('T')[0];
        if(dailyDataMap.has(day)) dailyDataMap.get(day)!.feeds.push(feed);
    }
    for (const sleep of sleeps) {
        const day = sleep.startedAt.toISOString().split('T')[0];
        if(dailyDataMap.has(day)) dailyDataMap.get(day)!.sleeps.push(sleep);
    }
    for (const pump of pumps) {
        const day = pump.startedAt.toISOString().split('T')[0];
        if(dailyDataMap.has(day)) dailyDataMap.get(day)!.pumps.push(pump);
    }
    for (const diaper of diapers) {
        const day = diaper.startedAt.toISOString().split('T')[0];
        if(dailyDataMap.has(day)) dailyDataMap.get(day)!.diapers.push(diaper);
    }
    
    // Feeding Stats
    let totalFeeds = feeds.length;
    let totalBottleOz = 0;
    let totalNursingMins = 0;
    let leftMins = 0;
    let rightMins = 0;
    
    for(const feed of feeds) {
        if(feed.kind === 'bottle') totalBottleOz += feed.amountOz || 0;
        if(feed.kind === 'nursing' && feed.endedAt) {
            const durationMins = (feed.endedAt.getTime() - feed.startedAt.getTime()) / (1000 * 60);
            totalNursingMins += durationMins;
            if (feed.side === 'left') leftMins += durationMins;
            else if (feed.side === 'right') rightMins += durationMins;
        }
    }
    
    const feedingChartData: DailyFeedStats[] = Array.from(dailyDataMap.entries()).map(([date, data]) => {
        const bottleAmountOz = data.feeds.reduce((sum, f) => sum + (f.kind === 'bottle' ? f.amountOz || 0 : 0), 0);
        const nursingDurationMins = data.feeds.reduce((sum, f) => {
            if (f.kind === 'nursing' && f.endedAt) {
                return sum + (f.endedAt.getTime() - f.startedAt.getTime()) / (1000 * 60);
            }
            return sum;
        }, 0);
        return { date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), bottleAmountOz, nursingDurationMins };
    });

    // Sleep Stats
    let totalSleepMins = 0;
    let longestSleepMins = 0;
    for(const sleep of sleeps) {
        if(sleep.endedAt) {
            const durationMins = (sleep.endedAt.getTime() - sleep.startedAt.getTime()) / (1000 * 60);
            totalSleepMins += durationMins;
            if(durationMins > longestSleepMins) longestSleepMins = durationMins;
        }
    }
    
     const sleepChartData: DailySleepStats[] = Array.from(dailyDataMap.entries()).map(([date, data]) => {
        const totalMins = data.sleeps.reduce((sum, s) => {
            if (s.endedAt) return sum + (s.endedAt.getTime() - s.startedAt.getTime()) / (1000 * 60);
            return sum;
        }, 0);
        return { date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), totalSleepMins: totalMins };
    });

    // Pump Stats
    let totalPumpedOz = pumps.reduce((sum, p) => sum + (p.totalAmountOz || 0), 0);
    const pumpChartData: DailyPumpStats[] = Array.from(dailyDataMap.entries()).map(([date, data]) => {
        const totalOz = data.pumps.reduce((sum, p) => sum + (p.totalAmountOz || 0), 0);
        return { date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), totalAmountOz: totalOz };
    });
    
    // Diaper Stats
    let totalChanges = diapers.length;
    const diaperChartData: DailyDiaperStats[] = Array.from(dailyDataMap.entries()).map(([date, data]) => {
        // FIX: Use 'diaperType' for comparison, as 'type' is always 'diaper'.
        const pee = data.diapers.filter(d => d.diaperType === 'pee').length;
        const poop = data.diapers.filter(d => d.diaperType === 'poop').length;
        const both = data.diapers.filter(d => d.diaperType === 'both').length;
        return { date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), pee, poop, both };
    });


    return {
        feeding: {
            totalFeeds,
            avgFeedsPerDay: totalFeeds / range,
            totalBottleOz,
            totalNursingMins,
            nursingBreakdown: { leftMins, rightMins },
            dailyChartData: feedingChartData,
        },
        sleep: {
            totalSleepMins,
            avgSleepPerDayMins: totalSleepMins / range,
            longestSleepMins,
            dailyChartData: sleepChartData,
        },
        pump: {
            totalPumpedOz,
            avgPumpedPerDayOz: totalPumpedOz / range,
            dailyChartData: pumpChartData,
        },
        diaper: {
            totalChanges,
            avgChangesPerDay: totalChanges / range,
            dailyChartData: diaperChartData,
        }
    };
};

export const formatMinsToHours = (mins: number) => {
    if (isNaN(mins) || mins < 0) return '0h 0m';
    const hours = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    return `${hours}h ${remainingMins}m`;
}