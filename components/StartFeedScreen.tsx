import React, { useState } from 'react';
import { FeedMode, BreastSide } from '../types';

interface StartFeedScreenProps {
  onBack: () => void;
  onStartNursing: (type: 'feed' | 'sleep', side?: BreastSide) => void;
}

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md flex-1 transition-colors ${
            isActive 
            ? 'bg-primary text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-light-text-secondary dark:text-dark-text-secondary'
        }`}
    >
        {label}
    </button>
);

const Toggle: React.FC<{label: string, enabled: boolean, setEnabled: (enabled: boolean) => void}> = ({label, enabled, setEnabled}) => (
    <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);

export const StartFeedScreen: React.FC<StartFeedScreenProps> = ({ onBack, onStartNursing }) => {
    const [mode, setMode] = useState<FeedMode>('breast');
    const [trackLatch, setTrackLatch] = useState(false);
    const [trackPain, setTrackPain] = useState(false);

    const handleStart = () => {
        // For now, we only implement starting a nursing timer from this screen.
        // A more complex implementation would handle bottle and pump forms.
        if (mode === 'breast') {
            onStartNursing('feed', 'left'); // Default to left side
        } else {
            alert(`${mode.charAt(0).toUpperCase() + mode.slice(1)} logging is not implemented yet.`);
        }
    };
    
    return (
        <div className="p-4 space-y-6">
            <header className="relative flex items-center justify-center">
                <button onClick={onBack} className="absolute left-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Start a Feed</h1>
            </header>
            
            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-6">
                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <TabButton label="Nursing" isActive={mode === 'breast'} onClick={() => setMode('breast')} />
                    <TabButton label="Bottle" isActive={mode === 'bottle'} onClick={() => setMode('bottle')} />
                    <TabButton label="Pump" isActive={mode === 'pump'} onClick={() => setMode('pump')} />
                </div>
                
                {mode === 'breast' && (
                    <div className="space-y-4 pt-4">
                        <Toggle label="Latch" enabled={trackLatch} setEnabled={setTrackLatch}/>
                        <Toggle label="Pain (optional)" enabled={trackPain} setEnabled={setTrackPain}/>
                    </div>
                )}
                
                {mode === 'bottle' && (
                     <p className="text-center text-gray-500 py-8">Bottle logging form coming soon!</p>
                )}
                
                {mode === 'pump' && (
                     <p className="text-center text-gray-500 py-8">Pumping log form coming soon!</p>
                )}
                
                <button 
                    onClick={handleStart}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Start
                </button>
            </div>
        </div>
    );
};