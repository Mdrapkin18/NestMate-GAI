import React from 'react';
import { AnyEntry, Baby } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { getAge } from '../utils/helpers';

interface DashboardProps {
  baby: Baby;
  entries: AnyEntry[];
  onStartTimer: (type: 'feed' | 'sleep', side?: 'left' | 'right') => void;
}

const StatCard: React.FC<React.PropsWithChildren<{ title: string; icon: React.ReactNode }>> = ({ title, icon, children }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
            {icon}
            <h3 className="font-semibold text-lg text-light-text dark:text-dark-text">{title}</h3>
        </div>
        <div className="pl-9 text-light-text-secondary dark:text-dark-text-secondary">
            {children}
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ baby, entries, onStartTimer }) => {
    // FIX: Check for 'kind' property to identify Feed entries and use getTime() for date comparison.
    const lastFeed = entries.filter(e => 'kind' in e && e.type === 'feed').sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
    // FIX: Check for 'category' property to identify Sleep entries and use getTime() for date comparison.
    const lastSleep = entries.filter(e => 'category' in e).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">{baby.name}</h1>
                {/* FIX: Convert Date object to string for getAge function. */}
                <p className="text-light-text-secondary dark:text-dark-text-secondary">{getAge(baby.dob.toISOString())}</p>
            </header>

            <div className="space-y-4">
                <StatCard title="Feeding" icon={<FeedingIcon className="text-brand-purple" />}>
                    {lastFeed ? `Last fed at ${new Date(lastFeed.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "No feeding entries yet."}
                    <p className="text-sm">Next feeding in 2 hours</p>
                </StatCard>
                <StatCard title="Sleep" icon={<SleepIcon className="text-brand-purple" />}>
                     {lastSleep ? `Last nap at ${new Date(lastSleep.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "No sleep entries yet."}
                </StatCard>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 text-light-text dark:text-dark-text">Quick Add</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onStartTimer('feed', 'left')} className="bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple-dark dark:text-brand-purple-light p-4 rounded-lg flex flex-col items-center justify-center space-y-2">
                        <FeedingIcon />
                        <span>Start Left</span>
                    </button>
                    <button onClick={() => onStartTimer('feed', 'right')} className="bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple-dark dark:text-brand-purple-light p-4 rounded-lg flex flex-col items-center justify-center space-y-2">
                        <FeedingIcon />
                        <span>Start Right</span>
                    </button>
                    <button onClick={() => onStartTimer('sleep')} className="bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple-dark dark:text-brand-purple-light p-4 rounded-lg flex flex-col items-center justify-center space-y-2 col-span-2">
                        <SleepIcon />
                        <span>Start Sleep</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
