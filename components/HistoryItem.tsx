import React from 'react';
import { AnyEntry, Feed, Sleep, Diaper, Bath, Pump } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { DiaperIcon } from './icons/DiaperIcon';
import { BathIcon } from './icons/BathIcon';
import { formatDuration } from '../utils/helpers';
import { PumpIcon } from './icons/PumpIcon';

interface HistoryItemProps {
  entry: AnyEntry;
  onClick: () => void;
}

const getEntryDetails = (entry: AnyEntry): { icon: React.ReactNode; title: string; details: string } => {
    const time = entry.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if ('kind' in entry) { // Feed or Pump entry
        const duration = entry.endedAt && entry.startedAt ? formatDuration(entry.endedAt.getTime() - entry.startedAt.getTime()) : 'In progress';
        
        if (entry.kind === 'pump') {
            const pump = entry as Pump;
            const total = pump.totalAmountOz?.toFixed(1) || '0.0';
            const sides = [
                pump.leftAmountOz ? `L: ${pump.leftAmountOz.toFixed(1)}oz` : null,
                pump.rightAmountOz ? `R: ${pump.rightAmountOz.toFixed(1)}oz` : null,
            ].filter(Boolean).join(' | ');

            return {
                icon: <PumpIcon className="w-5 h-5 text-teal-500" />,
                title: `Pumped ${total}oz`,
                details: `${time} · ${duration}${sides ? ` · ${sides}` : ''}`
            };
        }

        const feed = entry as Feed;
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

    if ('type' in entry) { // It's a Diaper entry
        const diaper = entry as Diaper;
        const title = `Diaper (${diaper.type.charAt(0).toUpperCase() + diaper.type.slice(1)})`;
        const details: string[] = [time];
        if (diaper.rash) details.push('Rash');
        if (diaper.consistency) details.push(diaper.consistency);
        if (diaper.color) details.push(diaper.color);
        if (diaper.volume) details.push(diaper.volume);

        return {
            icon: <DiaperIcon className="w-5 h-5 text-amber-600" />,
            title,
            details: details.join(' · ')
        };
    }
    
    if ('bathType' in entry) { // It's a Bath entry
        const bath = entry as Bath;
        return {
            icon: <BathIcon className="w-5 h-5 text-sky-500" />,
            title: `Bath (${bath.bathType.charAt(0).toUpperCase() + bath.bathType.slice(1)})`,
            details: time
        };
    }
    
    return { icon: null, title: 'Unknown Entry', details: time };
};

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry, onClick }) => {
    const { icon, title, details } = getEntryDetails(entry);

    return (
        <button onClick={onClick} className="w-full text-left flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-light-text dark:text-dark-text truncate">{title}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{details}</p>
            </div>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
    );
};