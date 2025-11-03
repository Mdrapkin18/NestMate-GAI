import React, { useState } from 'react';
import { Baby } from '../types';
import { getAge } from '../utils/helpers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';


interface BabyProfileProps {
  baby: Baby;
  onUpdateBaby: (updatedBaby: Baby) => void; // This will update the local state in App.tsx
  onBack: () => void;
}

const InputField: React.FC<{label: string, id: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string}> = 
({ label, id, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
        </label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
        />
    </div>
);

const formatDateForInput = (date: Date): string => {
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    return '';
};


export const BabyProfile: React.FC<BabyProfileProps> = ({ baby, onUpdateBaby, onBack }) => {
    const [formState, setFormState] = useState(baby);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSaveMessage('');
        const { id, value } = e.target;

        // Handle weight fields with special logic
        if (id === 'weightLbs' || id === 'weightOz') {
            let newLbs = formState.weightLbs ?? 0;
            let newOz = formState.weightOz ?? 0;
            const numValue = value === '' ? 0 : parseFloat(value);
            if (isNaN(numValue)) return; // Ignore non-numeric input

            if (id === 'weightLbs') {
                newLbs = numValue < 0 ? 0 : numValue;
            } else { // 'weightOz'
                newOz = numValue;
                // Handle rollover when oz goes to 16 or more
                if (newOz >= 16) {
                    newLbs += Math.floor(newOz / 16);
                    newOz %= 16;
                } 
                // Handle "borrowing" when oz goes below 0 (e.g., from spinner)
                else if (newOz < 0) {
                    if (newLbs > 0) {
                        newLbs -= 1;
                        newOz = 15;
                    } else {
                        // Can't borrow from 0 lbs, so just set oz to 0
                        newOz = 0;
                    }
                }
            }
            setFormState(prev => ({ ...prev, weightLbs: newLbs, weightOz: newOz }));
            return;
        }

        // Handle height to prevent negative values
        if (id === 'heightInches') {
             const numValue = value === '' ? undefined : parseFloat(value);
             if (value !== '' && (numValue === undefined || isNaN(numValue) || numValue < 0)) return;
             setFormState(prev => ({...prev, heightInches: numValue }));
             return;
        }
        
        // Handle all other fields normally
        let newValue: any = value;
        if (id === 'dob') {
            newValue = new Date(value + 'T00:00:00');
        }
    
        setFormState(prev => ({ ...prev, [id]: newValue }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        console.log('[BabyProfile] Attempting to save baby profile changes:', formState);
        try {
            const babyRef = doc(db, "babies", baby.id);
            const { id, ...saveData } = formState;
            await updateDoc(babyRef, saveData);
            
            onUpdateBaby(formState);
            setSaveMessage('Saved!');
            console.log('[BabyProfile] Save successful.');
        } catch (error) {
            console.error("[BabyProfile] Error saving baby profile:", error);
            setSaveMessage('Error saving.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    return (
        <div className="space-y-6">
            <header className="relative flex items-center justify-center">
                 <button onClick={onBack} className="absolute left-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Baby Profile</h1>
            </header>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-4">
                <InputField label="Name" id="name" value={formState.name} onChange={handleChange} placeholder="e.g., Keegan" />
                <InputField label="Date of Birth" id="dob" value={formatDateForInput(formState.dob)} onChange={handleChange} type="date" />
                
                <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Weight
                    </label>
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                id="weightLbs"
                                value={formState.weightLbs ?? ''}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text pr-10"
                            />
                             <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm">lbs</span>
                        </div>
                        <div className="relative flex-1">
                             <input
                                type="number"
                                id="weightOz"
                                value={formState.weightOz ?? ''}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text pr-10"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm">oz</span>
                        </div>
                    </div>
                </div>

                <InputField label="Height (in)" id="heightInches" value={formState.heightInches ?? ''} onChange={handleChange} type="number" placeholder="e.g., 21.5" />

                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-primary-300"
                >
                    {isSaving ? 'Saving...' : (saveMessage || 'Save Changes')}
                </button>
            </div>
        </div>
    );
};