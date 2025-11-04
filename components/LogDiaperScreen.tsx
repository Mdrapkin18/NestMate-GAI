import React, { useState } from 'react';
import { Diaper } from '../types';

type DiaperData = Omit<Diaper, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt' | 'type'>;

interface LogDiaperScreenProps {
  onBack: () => void;
  onSave: (data: DiaperData) => void;
}

const SelectionButton: React.FC<{label: string, isActive: boolean, onClick: () => void, className?: string}> = 
({ label, isActive, onClick, className }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border ${
            isActive
            ? 'bg-primary-100 dark:bg-primary-900 border-primary text-primary dark:text-primary-200'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-light-text-secondary dark:text-dark-text-secondary'
        } ${className}`}
    >
        {label}
    </button>
);

const ColorButton: React.FC<{color: string, name: string, isSelected: boolean, onClick: () => void}> = 
({ color, name, isSelected, onClick }) => (
    <div className="flex flex-col items-center space-y-1">
        <button
            onClick={onClick}
            style={{ backgroundColor: color }}
            className={`w-10 h-10 rounded-full border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}
            aria-label={name}
        />
        <span className={`text-xs ${isSelected ? 'text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>{name}</span>
    </div>
);


export const LogDiaperScreen: React.FC<LogDiaperScreenProps> = ({ onBack, onSave }) => {
    // FIX: Rename state to diaperType to match schema
    const [diaperType, setDiaperType] = useState<Diaper['diaperType']>('pee');
    const [rash, setRash] = useState(false);
    const [consistency, setConsistency] = useState<Diaper['consistency']>();
    const [color, setColor] = useState<Diaper['color']>();
    const [volume, setVolume] = useState<Diaper['volume']>();
    const [note, setNote] = useState('');

    const isPoop = diaperType === 'poop' || diaperType === 'both';
    const isPee = diaperType === 'pee' || diaperType === 'both';

    const handleSave = () => {
        // FIX: Use diaperType in saved data
        const saveData: DiaperData = { diaperType };
        if (rash) saveData.rash = true;
        if (note.trim()) saveData.note = note.trim();
        if (isPoop) {
            if (consistency) saveData.consistency = consistency;
            if (color) saveData.color = color;
        }
        if (isPee) {
             if (volume) saveData.volume = volume;
        }
        onSave(saveData);
    };
    
    return (
        <div className="p-4 space-y-6">
            <header className="relative flex items-center justify-center">
                <button onClick={onBack} className="absolute left-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Log Diaper Change</h1>
            </header>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Type</label>
                    <div className="flex items-center space-x-2">
                        {/* FIX: Update state setters to use diaperType */}
                        <SelectionButton label="Pee" isActive={diaperType === 'pee'} onClick={() => setDiaperType('pee')} className="flex-1" />
                        <SelectionButton label="Poop" isActive={diaperType === 'poop'} onClick={() => setDiaperType('poop')} className="flex-1" />
                        <SelectionButton label="Both" isActive={diaperType === 'both'} onClick={() => setDiaperType('both')} className="flex-1" />
                    </div>
                </div>

                {isPee && (
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Volume</label>
                        <div className="flex items-center space-x-2">
                            <SelectionButton label="Light" isActive={volume === 'light'} onClick={() => setVolume('light')} className="flex-1" />
                            <SelectionButton label="Medium" isActive={volume === 'medium'} onClick={() => setVolume('medium')} className="flex-1" />
                            <SelectionButton label="Heavy" isActive={volume === 'heavy'} onClick={() => setVolume('heavy')} className="flex-1" />
                        </div>
                    </div>
                )}

                {isPoop && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Consistency</label>
                            <div className="grid grid-cols-3 gap-2">
                                <SelectionButton label="Runny" isActive={consistency === 'runny'} onClick={() => setConsistency('runny')} />
                                <SelectionButton label="Mushy" isActive={consistency === 'mushy'} onClick={() => setConsistency('mushy')} />
                                <SelectionButton label="Soft" isActive={consistency === 'soft'} onClick={() => setConsistency('soft')} />
                                <SelectionButton label="Hard" isActive={consistency === 'hard'} onClick={() => setConsistency('hard')} />
                                <SelectionButton label="Solid" isActive={consistency === 'solid'} onClick={() => setConsistency('solid')} />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Color</label>
                            <div className="flex justify-around pt-2">
                                <ColorButton color="#FBBF24" name="Yellow" isSelected={color === 'yellow'} onClick={() => setColor('yellow')} />
                                <ColorButton color="#854d0e" name="Brown" isSelected={color === 'brown'} onClick={() => setColor('brown')} />
                                <ColorButton color="#166534" name="Green" isSelected={color === 'green'} onClick={() => setColor('green')} />
                                <ColorButton color="#1F2937" name="Black" isSelected={color === 'black'} onClick={() => setColor('black')} />
                                <ColorButton color="#DC2626" name="Red" isSelected={color === 'red'} onClick={() => setColor('red')} />
                            </div>
                        </div>
                    </>
                )}

                <div className="flex items-center justify-between">
                    <span className="font-medium">Rash?</span>
                    <button
                        onClick={() => setRash(!rash)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${rash ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${rash ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>

                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Notes (optional)</label>
                    <textarea
                        id="notes"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
                        placeholder="e.g., used new cream..."
                    />
                </div>
                
                <button 
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Save Diaper Change
                </button>
            </div>
        </div>
    );
};
