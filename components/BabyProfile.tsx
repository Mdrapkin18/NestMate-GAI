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
        
        let newValue: any = value;
        if (id === 'dob') {
            newValue = new Date(value + 'T00:00:00');
        } else if (e.target.type === 'number') {
            newValue = value === '' ? undefined : parseFloat(value);
            if (value !== '' && isNaN(newValue as number)) {
                return;
            }
        }
    
        setFormState(prev => ({ ...prev, [id]: newValue }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            // In a real app, baby profiles would be in a 'babies' collection
            // For now, we assume a static update path.
            // const babyRef = doc(db, "babies", baby.id);
            // await updateDoc(babyRef, { ...formState });
            
            // For this demo, we just update the local state passed from App.tsx
            onUpdateBaby(formState);
            setSaveMessage('Saved!');
        } catch (error) {
            console.error("Error saving baby profile:", error);
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
                <InputField label="Weight (kg)" id="weightKg" value={formState.weightKg ?? ''} onChange={handleChange} type="number" placeholder="e.g., 4.5"/>
                <InputField label="Height (cm)" id="heightCm" value={formState.heightCm ?? ''} onChange={handleChange} type="number" placeholder="e.g., 55" />

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