import React from 'react';
import { AnyEntry, Baby, TimerState, Feed } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { ActivityIcon } from './icons/DiaperIcon';
import { getAge, formatDuration, getAgeInMonths } from '../utils/helpers';
import { useTimer } from '../hooks/useTimer';

interface HomeScreenProps {
  baby: Baby;
  entries: AnyEntry[];
  activeTimer: TimerState | null;
  onStopTimer: () => void;
  onStartFeedClick: () => void;
  onStartSleepClick: () => void;
}

const StatCard: React.FC<React.PropsWithChildren<{ title: string; value: string; }>> = ({ title, value, children }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm flex-1">
        <h3 className="font-medium text-sm text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
        <p className="font-semibold text-2xl text-light-text dark:text-dark-text mt-1">{value}</p>
        {children}
    </div>
);

const QuickAddButton: React.FC<{label: string; icon: React.ReactNode; onClick: () => void;}> = ({label, icon, onClick}) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 text-light-text dark:text-dark-text">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary dark:text-primary-200">
            {icon}
        </div>
        <span className="font-medium">{label}</span>
    </button>
);


const ActiveTimerCard: React.FC<{timer: TimerState, onStop: () => void}> = ({ timer, onStop }) => {
    const { elapsed } = useTimer(timer.startedAt);
    const timerType = timer.type === 'feed' ? 'Feeding' : 'Sleep';
    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg border border-primary flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
                <div className="text-primary">
                     {timer.type === 'feed' ? <FeedingIcon className="h-6 w-6" /> : <SleepIcon className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{timerType}</p>
                  <p className="text-2xl font-semibold tracking-wider text-light-text dark:text-dark-text">{formatDuration(elapsed)}</p>
                </div>
            </div>
            <button 
                onClick={onStop}
                className="bg-transparent text-primary font-bold py-2 px-6 rounded-full border-2 border-primary hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
            >
                STOP
            </button>
        </div>
    );
}

const BabyCard: React.FC<{baby: Baby, activeTimer: TimerState | null}> = ({ baby, activeTimer }) => {
    const { elapsed } = useTimer(activeTimer?.startedAt || null);

    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 text-primary dark:text-primary-200 flex items-center justify-center text-xl font-bold">
                    {baby.name.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-lg">{baby.name}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{getAge(baby.dob.toISOString())}</p>
                </div>
            </div>
             {activeTimer && (
                <p className="font-semibold text-lg">{formatDuration(elapsed)}</p>
            )}
        </div>
    );
}


export const HomeScreen: React.FC<HomeScreenProps> = ({ baby, entries, activeTimer, onStopTimer, onStartFeedClick, onStartSleepClick }) => {
    const totalFeedsToday = entries.filter(e => 'kind' in e && e.startedAt.toDateString() === new Date().toDateString()).length;
    // This is a simplified duration calculation. A real app would sum up durations.
    const totalFeedTimeToday = "8 hr 45 min"; 
    const nextFeedIn = "1 hr 20 min";

    const ageInMonths = getAgeInMonths(baby.dob.toISOString());

    const getFeedingRecText = () => {
        const lastFeed = entries.find(e => 'kind' in e && e.endedAt) as Feed | undefined;
        if (!lastFeed || !lastFeed.endedAt) {
            return "Log a feeding to get suggestions.";
        }

        let minInterval, maxInterval;
        if (ageInMonths < 3) { [minInterval, maxInterval] = [2, 3]; } 
        else if (ageInMonths < 6) { [minInterval, maxInterval] = [3, 4]; } 
        else { [minInterval, maxInterval] = [4, 5]; }

        const nextFeedMin = new Date(lastFeed.endedAt.getTime() + minInterval * 60 * 60 * 1000);
        const nextFeedMax = new Date(lastFeed.endedAt.getTime() + maxInterval * 60 * 60 * 1000);
        
        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `Next feed: ${formatTime(nextFeedMin)} - ${formatTime(nextFeedMax)}`;
    };
    
    const getSleepRecText = () => {
        const lastSleep = entries.find(e => 'category' in e && e.endedAt);
        if (!lastSleep || !lastSleep.endedAt) {
            return "Log a sleep session to get suggestions.";
        }

        let minWake, maxWake;
        if (ageInMonths < 3) { [minWake, maxWake] = [60, 90]; }
        else if (ageInMonths < 6) { [minWake, maxWake] = [90, 120]; }
        else { [minWake, maxWake] = [120, 180]; }
        
        const nextNapMin = new Date(lastSleep.endedAt.getTime() + minWake * 60 * 1000);
        const nextNapMax = new Date(lastSleep.endedAt.getTime() + maxWake * 60 * 1000);

        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `Next nap: ${formatTime(nextNapMin)} - ${formatTime(nextNapMax)}`;
    };

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Home</h1>
            </header>

            <BabyCard baby={baby} activeTimer={activeTimer}/>
            
            {activeTimer && <ActiveTimerCard timer={activeTimer} onStop={onStopTimer} />}

            <div className="space-y-4">
                <StatCard title="Feeding today" value={`${totalFeedsToday} feedings`}>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{totalFeedTimeToday}</p>
                </StatCard>
                 <StatCard title="Next feeding in" value={nextFeedIn} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-dark-text">AI Suggestions</h3>
                <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-full">
                            <FeedingIcon className="w-4 h-4 text-primary dark:text-primary-200" />
                        </div>
                        <p className="text-sm text-light-text dark:text-dark-text">{getFeedingRecText()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                         <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-full">
                            <SleepIcon className="w-4 h-4 text-primary dark:text-primary-200" />
                        </div>
                        <p className="text-sm text-light-text dark:text-dark-text">{getSleepRecText()}</p>
                    </div>
                     <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
                        Disclaimer: These are general suggestions, not medical advice.
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-dark-text">Quick Add</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <QuickAddButton label="Feeding" icon={<FeedingIcon className="w-8 h-8"/>} onClick={onStartFeedClick} />
                    <QuickAddButton label="Sleep" icon={<SleepIcon className="w-8 h-8"/>} onClick={onStartSleepClick} />
                    <QuickAddButton label="Activity" icon={<ActivityIcon className="w-8 h-8"/>} onClick={() => alert('Log activity clicked!')} />
                </div>
            </div>
        </div>
    );
};