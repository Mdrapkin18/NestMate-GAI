import React, { useState, useEffect, useMemo } from 'react';
import { Baby, UserProfile, AnyEntry } from '../types';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { processStatsData, FeedingStats, SleepStats, PumpStats, DateRange, DiaperStats } from '../utils/stats';
import { FeedingStats as FeedingStatsComponent } from './stats/FeedingStats';
import { SleepStats as SleepStatsComponent } from './stats/SleepStats';
import { PumpStats as PumpStatsComponent } from './stats/PumpStats';
import { DiaperStats as DiaperStatsComponent } from './stats/DiaperStats';
import { SkeletonLoader } from './common/SkeletonLoader';

interface StatsScreenProps {
  baby: Baby;
  userProfile: UserProfile;
}

const DateRangePicker: React.FC<{selected: DateRange, onSelect: (range: DateRange) => void}> = ({ selected, onSelect }) => (
    <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[7, 30, 90].map(d => (
            <button 
                key={d}
                onClick={() => onSelect(d as DateRange)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md flex-1 transition-colors ${selected === d ? 'bg-primary text-white shadow' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
            >
                {d} days
            </button>
        ))}
    </div>
);

export const StatsScreen: React.FC<StatsScreenProps> = ({ baby, userProfile }) => {
    const [dateRange, setDateRange] = useState<DateRange>(7);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{ feeding: FeedingStats, sleep: SleepStats, pump: PumpStats, diaper: DiaperStats } | null>(null);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            if (!baby || !userProfile.familyId) return;

            setLoading(true);

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - dateRange);

            try {
                const entriesRef = collection(db, "entries");
                // IMPORTANT: This query requires a composite index in Firestore.
                // If you see an error in the console with a link to create an index,
                // you must click it to enable this query.
                const q = query(
                    entriesRef, 
                    where("familyId", "==", userProfile.familyId),
                    where("babyId", "==", baby.id),
                    where("startedAt", ">=", Timestamp.fromDate(startDate)),
                    where("startedAt", "<=", Timestamp.fromDate(endDate)),
                    orderBy("startedAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                const fetchedEntries: AnyEntry[] = [];
                // Note: We are not using Zod parsing here for performance on a potentially large dataset.
                // This assumes data in Firestore is valid. For production, a more robust parsing
                // or server-side aggregation would be better.
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to JS Dates
                    const entryWithDates = Object.fromEntries(
                        Object.entries(data).map(([key, value]) => 
                            value instanceof Timestamp ? [key, (value as Timestamp).toDate()] : [key, value]
                        )
                    );
                    fetchedEntries.push({ id: doc.id, ...entryWithDates } as AnyEntry);
                });

                console.log(`[StatsScreen] Fetched ${fetchedEntries.length} entries for the last ${dateRange} days.`);
                
                const processed = processStatsData(fetchedEntries, dateRange);
                setStats(processed);

            } catch (error) {
                console.error("[StatsScreen] Error fetching entries:", error);
                // In a real app, show an error message to the user
            } finally {
                setLoading(false);
            }
        };

        fetchAndProcessData();
    }, [baby, userProfile, dateRange]);
    
    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Charts & Stats</h1>
            </header>

            <DateRangePicker selected={dateRange} onSelect={setDateRange} />

            {loading ? (
                <div className="space-y-6">
                    <SkeletonLoader className="h-64" />
                    <SkeletonLoader className="h-64" />
                    <SkeletonLoader className="h-64" />
                    <SkeletonLoader className="h-64" />
                </div>
            ) : stats ? (
                <div className="space-y-6">
                    <FeedingStatsComponent stats={stats.feeding} />
                    <SleepStatsComponent stats={stats.sleep} />
                    <PumpStatsComponent stats={stats.pump} />
                    <DiaperStatsComponent stats={stats.diaper} />
                </div>
            ) : (
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary pt-10">
                    No data available for this period. Try logging some activities!
                </p>
            )}
        </div>
    );
};