import React from 'react';

interface SyncScreenProps {
  onBack: () => void;
}

const QueuedAction: React.FC<{title: string, subtitle: string}> = ({title, subtitle}) => (
    <div className="p-4">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{subtitle}</p>
    </div>
);

export const SyncScreen: React.FC<SyncScreenProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <header className="relative flex items-center justify-center">
        <button onClick={onBack} className="absolute left-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Sync & Offline Status</h1>
      </header>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 text-center dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-300">
        Offline - changes will sync when you're back online.
      </div>
      
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Queued actions</h2>
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
            <QueuedAction title="Add Feed" subtitle="Bottle 4.0 oz 10:45 AM" />
            <QueuedAction title="Stop Sleep" subtitle="Nap ended 2:15 PM" />
            <QueuedAction title="Edit Feed" subtitle="Note: gassy; +1 oz" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Conflict detected</h2>
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-3">
           <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">A feed at 10:42 exists on another device. Keep both or merge?</p>
            <div className="flex space-x-3">
                <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg transition-colors">
                    Keep both (dupe-safe)
                </button>
                 <button className="flex-1 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                    Merge into 10:45 event
                </button>
            </div>
        </div>
      </div>

        <button className="w-full bg-primary-100 dark:bg-primary-900 text-primary dark:text-primary-200 font-bold py-3 px-4 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors">
            Retry sync now
        </button>

    </div>
  );
};
