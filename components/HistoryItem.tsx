import React from 'react';
import { AnyEntry, Feed, Sleep } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { ActivityIcon } from './icons/DiaperIcon'; // Assuming this will be used for other types later
import { formatDuration } from '../utils/helpers';

interface HistoryItemProps {
  entry: AnyEntry;
}

const getEntryDetails = (entry: AnyEntry): { icon: React.ReactNode; title: string; details: string } => {
    const time = entry.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if ('kind' in entry) { // It's a Feed entry
        const feed = entry as Feed;
        const duration = feed.endedAt && feed.startedAt ? formatDuration(feed.endedAt.getTime() - feed.startedAt.getTime()) : 'In progress';
        
        switch(feed.kind) {
            case 'nursing':
                return {
                    icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                    title: `Nursing (${feed.side})`,
                    details: `${time} · ${duration}`
                };
            case 'bottle':
                const displayAmount = feed.amountOz?.toFixed(1);
                return {
                    icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                    title: `Bottle Feed`,
                    details: `${time} · ${displayAmount}oz`
                };
            case 'pump':
                 return {
                    icon: <FeedingIcon className="w-5 h-5 text-primary" />,
                    title: 'Pumped',
                    details: `${time} · ${duration}`
                };
        }
    }

    if ('category' in entry) { // It's a Sleep entry
        const sleep = entry as Sleep;
        const sleepDuration = sleep.endedAt && sleep.startedAt ? formatDuration(sleep.endedAt.getTime() - sleep.startedAt.getTime()) : 'In progress';
        return {
            icon: <SleepIcon className="w-5 h-5 text-indigo-500" />,
            title: `Sleep (${sleep.category})`,
            details: `${time} · ${sleepDuration}`
        };
    }
    
    return { icon: null, title: 'Unknown Entry', details: time };
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
