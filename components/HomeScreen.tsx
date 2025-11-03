import React from 'react';
import { AnyEntry, Baby, TimerState } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { ActivityIcon } from './icons/DiaperIcon';
import { getAge, formatDuration } from '../utils/helpers';
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
    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg border border-primary flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
                <div className="text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-2xl font-semibold tracking-wider text-light-text dark:text-dark-text">{formatDuration(elapsed)}</p>
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
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{getAge(baby.dob)}</p>
                </div>
            </div>
             {activeTimer && (
                <p className="font-semibold text-lg">{formatDuration(elapsed)}</p>
            )}
        </div>
    );
}


export const HomeScreen: React.FC<HomeScreenProps> = ({ baby, entries, activeTimer, onStopTimer, onStartFeedClick, onStartSleepClick }) => {
    const totalFeedsToday = entries.filter(e => e.type === 'feed' && new Date(e.startedAt).toDateString() === new Date().toDateString()).length;
    // This is a simplified duration calculation. A real app would sum up durations.
    const totalFeedTimeToday = "8 hr 45 min"; 
    const nextFeedIn = "1 hr 20 min";

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