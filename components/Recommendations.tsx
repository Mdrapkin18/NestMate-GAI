import React from 'react';
import { AnyEntry, Baby } from '../types';
import { getAgeInMonths } from '../utils/helpers';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';

interface RecommendationsProps {
  baby: Baby;
  entries: AnyEntry[];
}

const RecommendationCard: React.FC<React.PropsWithChildren<{ title: string; icon: React.ReactNode }>> = ({ title, icon, children }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
            {icon}
            <h3 className="font-semibold text-lg text-light-text dark:text-dark-text">{title}</h3>
        </div>
        <div className="pl-9 text-light-text dark:text-dark-text">
            {children}
        </div>
    </div>
);

export const Recommendations: React.FC<RecommendationsProps> = ({ baby, entries }) => {
    // FIX: Convert Date object to string for getAgeInMonths function.
    const ageInMonths = getAgeInMonths(baby.dob.toISOString());

    const getFeedingRec = () => {
        // FIX: Check for 'kind' property to identify Feed entries.
        const lastFeed = entries.find(e => 'kind' in e && e.type === 'feed' && e.endedAt);
        if (!lastFeed || !lastFeed.endedAt) {
            return <p>Log a feeding to get recommendations.</p>;
        }

        let minInterval, maxInterval, intervalText;
        if (ageInMonths < 3) {
            [minInterval, maxInterval, intervalText] = [2, 3, "2-3 hours"];
        } else if (ageInMonths < 6) {
            [minInterval, maxInterval, intervalText] = [3, 4, "3-4 hours"];
        } else {
            [minInterval, maxInterval, intervalText] = [4, 5, "4-5 hours"];
        }

        // FIX: Use getTime() to perform arithmetic on dates.
        const nextFeedMin = new Date(lastFeed.endedAt.getTime() + minInterval * 60 * 60 * 1000);
        const nextFeedMax = new Date(lastFeed.endedAt.getTime() + maxInterval * 60 * 60 * 1000);

        return (
            <>
                <p>Based on a typical <span className="font-semibold">{intervalText}</span> schedule for this age.</p>
                <p className="mt-2 text-brand-purple dark:text-brand-purple-light font-bold text-lg">
                    Next feed around {nextFeedMin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {nextFeedMax.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </>
        );
    };
    
    const getSleepRec = () => {
        // FIX: Check for 'category' property to identify Sleep entries.
        const lastSleep = entries.find(e => 'category' in e && e.endedAt);
        if (!lastSleep || !lastSleep.endedAt) {
            return <p>Log a sleep session to get recommendations.</p>;
        }

        let minWake, maxWake, wakeWindowText;
        if (ageInMonths < 3) {
            [minWake, maxWake, wakeWindowText] = [60, 90, "60-90 minutes"];
        } else if (ageInMonths < 6) {
            [minWake, maxWake, wakeWindowText] = [90, 120, "90-120 minutes"];
        } else {
            [minWake, maxWake, wakeWindowText] = [120, 180, "2-3 hours"];
        }
        
        // FIX: Use getTime() to perform arithmetic on dates.
        const nextNapMin = new Date(lastSleep.endedAt.getTime() + minWake * 60 * 1000);
        const nextNapMax = new Date(lastSleep.endedAt.getTime() + maxWake * 60 * 1000);
        
        return (
            <>
                <p>Based on a typical wake window of <span className="font-semibold">{wakeWindowText}</span>.</p>
                 <p className="mt-2 text-brand-purple dark:text-brand-purple-light font-bold text-lg">
                    Next nap around {nextNapMin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {nextNapMax.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </>
        );
    };

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Recommendations</h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary">For {baby.name}</p>
            </header>

            <div className="space-y-4">
                <RecommendationCard title="Next Feeding" icon={<FeedingIcon className="text-brand-purple" />}>
                    {getFeedingRec()}
                </RecommendationCard>
                <RecommendationCard title="Next Sleep" icon={<SleepIcon className="text-brand-purple" />}>
                    {getSleepRec()}
                </RecommendationCard>
            </div>
             <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary px-4">
                Disclaimer: These are general suggestions based on age. Every baby is different. Consult with a pediatrician for medical advice.
            </p>
        </div>
    );
};
