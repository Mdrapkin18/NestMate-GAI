import React, { useState } from 'react';
import { Baby } from '../types';
import { SyncScreen } from './SyncScreen';
import { ExportScreen } from './ExportScreen';
import { FamilyScreen } from './FamilyScreen';
import { RemindersScreen } from './RemindersScreen';
import { BabyProfile } from './BabyProfile';

interface SettingsScreenProps {
  baby: Baby;
  onUpdateBaby: (updatedBaby: Baby) => void;
  onLogout: () => void;
}

type SettingsPage = 'main' | 'profile' | 'sync' | 'export' | 'family' | 'reminders';

const SettingsButton: React.FC<React.PropsWithChildren<{onClick: () => void}>> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-full text-left bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center">
        <span className="font-medium">{children}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
);


export const SettingsScreen: React.FC<SettingsScreenProps> = ({ baby, onUpdateBaby, onLogout }) => {
    const [page, setPage] = useState<SettingsPage>('main');

    const renderPage = () => {
        switch(page) {
            case 'sync':
                return <SyncScreen onBack={() => setPage('main')} />;
            case 'export':
                return <ExportScreen onBack={() => setPage('main')} />;
            case 'family':
                return <FamilyScreen onBack={() => setPage('main')} />;
            case 'reminders':
                return <RemindersScreen onBack={() => setPage('main')} />;
            case 'profile':
                 return <BabyProfile baby={baby} onUpdateBaby={onUpdateBaby} onLogout={onLogout} />;
            default:
                return (
                    <>
                        <header>
                            <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Settings</h1>
                        </header>
                         <div className="space-y-3">
                            <SettingsButton onClick={() => setPage('profile')}>Baby Profile</SettingsButton>
                            <SettingsButton onClick={() => setPage('family')}>Family & Caregivers</SettingsButton>
                            <SettingsButton onClick={() => setPage('reminders')}>Reminders & Intervals</SettingsButton>
                            <SettingsButton onClick={() => setPage('sync')}>Sync & Offline Status</SettingsButton>
                            <SettingsButton onClick={() => setPage('export')}>Export Data</SettingsButton>
                        </div>
                        <div className="pt-4">
                             <button 
                                onClick={onLogout}
                                className="w-full bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="p-4 space-y-6">
            {renderPage()}
        </div>
    );
};
