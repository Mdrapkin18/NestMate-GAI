import React, { useState } from 'react';
import { Baby } from '../types';
import { getAge } from '../utils/helpers';

interface BabyProfileProps {
  baby: Baby;
  onUpdateBaby: (updatedBaby: Baby) => void;
  onLogout: () => void;
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


export const BabyProfile: React.FC<BabyProfileProps> = ({ baby, onUpdateBaby, onLogout }) => {
    const [formState, setFormState] = useState(baby);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSaved(false);
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        onUpdateBaby(formState);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="p-4 space-y-6">
            <header className="text-center">
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Settings</h1>
            </header>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-4">
                <h2 className="text-lg font-semibold">Baby Profile</h2>
                <InputField label="Name" id="name" value={formState.name} onChange={handleChange} placeholder="e.g., Keegan" />
                <InputField label="Date of Birth" id="dob" value={formState.dob} onChange={handleChange} type="date" />
                <InputField label="Weight (kg)" id="weightKg" value={formState.weightKg || ''} onChange={handleChange} type="number" placeholder="e.g., 4.5"/>
                <InputField label="Height (cm)" id="heightCm" value={formState.heightCm || ''} onChange={handleChange} type="number" placeholder="e.g., 55" />

                <button 
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    {isSaved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
            
            <div className="pt-4">
                 <button 
                    onClick={onLogout}
                    className="w-full bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-light-text-secondary dark:text-dark-text-secondary font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};