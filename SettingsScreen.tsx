import React, { useState } from 'react';
import { Baby } from './types';
import { SyncScreen } from './components/SyncScreen';
import { ExportScreen } from './components/ExportScreen';
import { FamilyScreen } from './components/FamilyScreen';
import { RemindersScreen } from './components/RemindersScreen';
import { BabyProfile } from './components/BabyProfile';
import { useAuth } from './hooks/useAuth';

interface SettingsScreenProps {
  baby: Baby;
  onSave: (updatedBaby: Baby) => Promise<void>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type SettingsPage = 'main' | 'profile' | 'sync' | 'export' | 'family' | 'reminders';

const SettingsButton: React.FC<React.PropsWithChildren<{onClick: () => void}>> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-full text-left bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center">
        <span className="font-medium">{children}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
);

const ToggleButton: React.FC<{label: string, enabled: boolean, onToggle: () => void}> = ({ label, enabled, onToggle }) => (
    <div className="w-full text-left bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-sm flex justify-between items-center">
        <span className="font-medium">{label}</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);


export const SettingsScreen: React.FC<SettingsScreenProps> = ({ baby, onSave, isDarkMode, onToggleDarkMode }) => {
    const [page, setPage] = useState<SettingsPage>('main');
    const { userProfile } = useAuth();

    const renderPage = () => {
        switch(page) {
            case 'sync':
                return <SyncScreen onBack={() => setPage('main')} />;
            case 'export':
                return <ExportScreen onBack={() => setPage('main')} />;
            case 'family':
                return <FamilyScreen onBack={() => setPage('main')} userProfile={userProfile!} />;
            case 'reminders':
                return <RemindersScreen onBack={() => setPage('main')} />;
            case 'profile':
                 return <BabyProfile baby={baby} onSave={onSave} onBack={() => setPage('main')} />;
            default:
                return (
                    <>
                        <header>
                            <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">Settings</h1>
                        </header>
                         <div className="space-y-3">
                            <h3 className="font-semibold text-light-text-secondary dark:text-dark-text-secondary px-2">Profile</h3>
                            <SettingsButton onClick={() => setPage('profile')}>Baby Profile</SettingsButton>
                            <SettingsButton onClick={() => setPage('family')}>Family & Caregivers</SettingsButton>
                            
                            <h3 className="font-semibold text-light-text-secondary dark:text-dark-text-secondary px-2 pt-4">App</h3>
                            <ToggleButton label="Dark Mode" enabled={isDarkMode} onToggle={onToggleDarkMode} />
                            <SettingsButton onClick={() => setPage('reminders')}>Reminders & Intervals</SettingsButton>
                            <SettingsButton onClick={() => setPage('sync')}>Sync & Offline Status</SettingsButton>
                            <SettingsButton onClick={() => setPage('export')}>Export Data</SettingsButton>
                        </div>
                        <div className="pt-4">
                             <button 
                                onClick={useAuth().signOut}
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