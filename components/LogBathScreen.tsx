import React, { useState, useMemo } from 'react';
import { Bath, AnyEntry } from '../types';

type BathData = Omit<Bath, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt'>;

interface LogBathScreenProps {
  onBack: () => void;
  onSave: (data: BathData) => void;
  entries: AnyEntry[];
}

const SelectionButton: React.FC<{label: string, isActive: boolean, onClick: () => void, className?: string}> = 
({ label, isActive, onClick, className }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-base font-medium rounded-lg transition-colors border-2 text-center ${
            isActive
            ? 'bg-primary border-primary text-white'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-light-text-secondary dark:text-dark-text-secondary'
        } ${className}`}
    >
        {label}
    </button>
);


export const LogBathScreen: React.FC<LogBathScreenProps> = ({ onBack, onSave, entries }) => {
    const [bathType, setBathType] = useState<Bath['bathType']>('sponge');

    const timeSinceLastBath = useMemo(() => {
        const lastBath = entries.find(e => 'bathType' in e);
        if (!lastBath) {
            return "No previous bath recorded.";
        }
        const now = Date.now();
        const diffMs = now - lastBath.startedAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} since last bath.`;
        }
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} since last bath.`;
    }, [entries]);

    const handleSave = () => {
        // FIX: Add missing 'type' property to satisfy the discriminated union.
        onSave({ type: 'bath', bathType });
    };
    
    return (
        <div className="p-4 space-y-6">
            <header className="relative flex items-center justify-center">
                <button onClick={onBack} className="absolute left-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Log Bath Time</h1>
            </header>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-8 text-center">
                <p className="text-light-text-secondary dark:text-dark-text-secondary">{timeSinceLastBath}</p>
                
                <div className="space-y-4">
                    <label className="block text-lg font-medium text-light-text dark:text-dark-text mb-2">Bath Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectionButton label="Sponge Bath" isActive={bathType === 'sponge'} onClick={() => setBathType('sponge')} />
                        <SelectionButton label="Full Bath" isActive={bathType === 'full'} onClick={() => setBathType('full')} />
                    </div>
                </div>
                
                <button 
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Save Bath
                </button>
            </div>
        </div>
    );
};