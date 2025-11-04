import React, { useState } from 'react';
import { FeedMode, BreastSide, BottleType } from '../types';
import { FeedingIcon } from './icons/FeedingIcon';

interface StartFeedScreenProps {
  onBack: () => void;
  onStartNursing: (type: 'feed', side?: BreastSide) => void;
  onLogBottle: (amount: number, unit: 'oz' | 'ml', bottleType: BottleType) => void;
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

const BottleTypeButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
            isActive
            ? 'bg-primary-100 dark:bg-primary-900 border-primary text-primary dark:text-primary-200'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-light-text-secondary dark:text-dark-text-secondary'
        }`}
    >
        {label}
    </button>
);

export const StartFeedScreen: React.FC<StartFeedScreenProps> = ({ onBack, onStartNursing, onLogBottle }) => {
    const [mode, setMode] = useState<FeedMode>('breast');
    
    // Nursing state
    const [trackLatch, setTrackLatch] = useState(false);
    const [trackPain, setTrackPain] = useState(false);

    // Bottle state
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState<'oz' | 'ml'>('oz');
    const [bottleType, setBottleType] = useState<BottleType>('breastmilk');

    const handleAction = () => {
        if (mode === 'breast') {
            onStartNursing('feed', 'left'); // Default to left side for simplicity
        } else if (mode === 'bottle') {
            const parsedAmount = parseFloat(amount);
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                onLogBottle(parsedAmount, unit, bottleType);
            } else {
                alert('Please enter a valid amount.');
            }
        } else {
            alert(`${mode.charAt(0).toUpperCase() + mode.slice(1)} logging is not implemented yet.`);
        }
    };
    
    return (
        <div className="p-4 space-y-6">
            <header className="relative flex items-center justify-center">
                <button onClick={onBack} className="absolute left-0">
                     <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
                     <div className="space-y-4 pt-4">
                         <div className="flex items-center space-x-2">
                             <input
                                 type="number"
                                 value={amount}
                                 onChange={(e) => setAmount(e.target.value)}
                                 placeholder="Amount"
                                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
                             />
                             <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                                 <button onClick={() => setUnit('oz')} className={`px-3 py-2 text-sm ${unit === 'oz' ? 'bg-primary-100 dark:bg-primary-900 text-primary' : ''}`}>oz</button>
                                 <button onClick={() => setUnit('ml')} className={`px-3 py-2 text-sm ${unit === 'ml' ? 'bg-primary-100 dark:bg-primary-900 text-primary' : ''}`}>ml</button>
                             </div>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Type</label>
                             <div className="flex items-center space-x-2">
                                <BottleTypeButton label="Breastmilk" isActive={bottleType === 'breastmilk'} onClick={() => setBottleType('breastmilk')} />
                                <BottleTypeButton label="Formula" isActive={bottleType === 'formula'} onClick={() => setBottleType('formula')} />
                                <BottleTypeButton label="Mixed" isActive={bottleType === 'mixed'} onClick={() => setBottleType('mixed')} />
                             </div>
                         </div>
                     </div>
                )}
                
                {mode === 'pump' && (
                     <p className="text-center text-gray-500 py-8">Pumping log form coming soon!</p>
                )}
                
                <button 
                    onClick={handleAction}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    {mode === 'bottle' ? 'Log Bottle' : 'Start'}
                </button>
            </div>
        </div>
    );
};