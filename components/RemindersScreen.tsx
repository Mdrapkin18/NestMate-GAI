import React from 'react';

interface RemindersScreenProps {
  onBack: () => void;
}

const LabeledInput: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</label>
        <p className="font-medium">{value}</p>
    </div>
);

const Toggle: React.FC<{label: string, enabled: boolean}> = ({label, enabled}) => (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        <span className="font-medium">{label}</span>
        <button
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);


export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <header className="relative flex items-center justify-center">
        <button onClick={onBack} className="absolute left-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Settings - Reminders & Intervals</h1>
      </header>
        
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg">Feeding interval target</h2>
            <div className="space-y-3">
                <LabeledInput label="Default interval" value="3 hr 0 min" />
                <LabeledInput label="Night interval (optional)" value="4 hr 0 min" />
            </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg">Smart reminders</h2>
            <div className="space-y-3">
                <Toggle label="Notify when next feeding window opens" enabled={true} />
                <Toggle label="Nudge if no sleep logged by 10 PM" enabled={false} />
            </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg">Quiet hours</h2>
            <div className="space-y-3">
                 <LabeledInput label="Do-not-disturb window" value="10:00 pm – 6:00 am" />
            </div>
        </div>

        <button className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors">
            Save preferences
        </button>
    </div>
  );
};
