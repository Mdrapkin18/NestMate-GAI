import React from 'react';

interface ExportScreenProps {
  onBack: () => void;
}

const Checkbox: React.FC<{label: string, id: string, defaultChecked?: boolean}> = ({label, id, defaultChecked}) => (
    <div className="flex items-center">
        <input id={id} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        <label htmlFor={id} className="ml-3 block text-sm font-medium">
            {label}
        </label>
    </div>
);

const LabeledInput: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</label>
        <p className="font-medium">{value}</p>
    </div>
);

export const ExportScreen: React.FC<ExportScreenProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <header className="relative flex items-center justify-center">
        <button onClick={onBack} className="absolute left-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Export Data</h1>
      </header>
        
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg">Choose what to export</h2>
            <div className="space-y-3">
                <Checkbox id="feeding" label="Feeding logs (CSV)" defaultChecked />
                <Checkbox id="sleep" label="Sleep logs (CSV)" defaultChecked />
                <Checkbox id="growth" label="Growth + diapers (CSV)" />
            </div>
            <div className="space-y-3 pt-2">
                <LabeledInput label="Date range" value="Oct 1, 2025 – Nov 2, 2025" />
                <LabeledInput label="Select baby" value="Keegan Drapkin" />
            </div>
             <button className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                Generate files
            </button>
        </div>

        <div className="space-y-3">
             <h2 className="font-semibold text-lg">Recent exports</h2>
             <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4">
                 <p className="font-mono text-sm">2025-11-02 16:10</p>
                 <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Feeding, Sleep</p>
             </div>
        </div>
        
        <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold py-3 px-4 rounded-lg transition-colors">
            Open export folder
        </button>

    </div>
  );
};