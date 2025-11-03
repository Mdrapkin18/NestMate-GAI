import React from 'react';
import { AnyEntry } from '../types';
import { formatHistoryDate } from '../utils/helpers';
import { HistoryItem } from './HistoryItem';

interface HistoryScreenProps {
  entries: AnyEntry[];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ entries }) => {
    const groupedEntries = entries.reduce((acc, entry) => {
        const dateKey = new Date(entry.startedAt).toDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
    }, {} as Record<string, AnyEntry[]>);

    const sortedDateKeys = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return (
        <div className="p-4 space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">History</h1>
            </header>

            {sortedDateKeys.length === 0 ? (
                 <p className="mt-8 text-center text-gray-500">No entries have been logged yet.</p>
            ) : (
                sortedDateKeys.map(dateKey => (
                    <div key={dateKey}>
                        <h2 className="text-lg font-semibold text-light-text dark:text-dark-text py-2 sticky top-0 bg-light-bg dark:bg-dark-bg z-10">
                            {formatHistoryDate(new Date(dateKey).getTime())}
                        </h2>
                        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
                            {groupedEntries[dateKey].map(entry => (
                                <div className="px-4" key={entry.id}>
                                    <HistoryItem entry={entry} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
