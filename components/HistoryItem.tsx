import React from 'react';
import { AnyEntry, FeedEntry, SleepEntry, DiaperEntry } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { ActivityIcon } from './icons/DiaperIcon';
import { formatDuration } from '../utils/helpers';

interface HistoryItemProps {
  entry: AnyEntry;
}

const getEntryDetails = (entry: AnyEntry): { icon: React.ReactNode; title: string; details: string } => {
    const time = new Date(entry.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch (entry.type) {
        case 'feed': {
            const feed = entry as FeedEntry;
            const duration = feed.endedAt && feed.startedAt ? formatDuration(feed.endedAt - feed.startedAt) : 'In progress';
            if (feed.mode === 'breast') {
                return {
                    icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                    title: `Nursing (${feed.side})`,
                    details: `${time} · ${duration}`
                };
            }
            if (feed.mode === 'bottle') {
                const unit = feed.amountMl && feed.amountMl > 200 ? 'ml' : 'ml'; // simple logic for demo
                const displayAmount = feed.amountMl?.toFixed(0);
                return {
                    icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                    title: `Bottle Feed`,
                    details: `${time} · ${displayAmount}${unit} ${feed.bottleType}`
                };
            }
             return {
                icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                title: 'Pumped',
                details: `${time} · ${duration}`
            };
        }
        case 'sleep': {
            const sleep = entry as SleepEntry;
            const sleepDuration = sleep.endedAt && sleep.startedAt ? formatDuration(sleep.endedAt - sleep.startedAt) : 'In progress';
            return {
                icon: <SleepIcon className="w-5 h-5 text-indigo-500" />,
                title: 'Sleep',
                details: `${time} · ${sleepDuration}`
            };
        }
        case 'diaper': {
            const diaper = entry as DiaperEntry;
            const diaperDetails = [diaper.wet && 'Wet', diaper.dirty && 'Dirty'].filter(Boolean).join(' & ');
            return {
                icon: <ActivityIcon className="w-5 h-5 text-amber-500" />,
                title: 'Diaper',
                details: `${time} · ${diaperDetails}`
            };
        }
        default:
            return { icon: null, title: 'Unknown Entry', details: time };
    }
};

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry }) => {
    const { icon, title, details } = getEntryDetails(entry);

    return (
        <div className="flex items-center space-x-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-light-text dark:text-dark-text">{title}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{details}</p>
            </div>
        </div>
    );
};
