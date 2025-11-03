import React, { useState, useMemo } from 'react';
import { AnyEntry, Feed, Sleep, Pump } from '../types';

interface EditEntryScreenProps {
  entry: AnyEntry;
  onBack: () => void;
  onSave: (updatedEntry: AnyEntry) => void;
  onDelete: (entryId: string) => void;
}

const InputField: React.FC<{label: string, id: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, step?: string}> = 
({ label, id, value, onChange, type = 'text', step }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
        </label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            step={step}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
        />
    </div>
);

const formatDateForInput = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const EditEntryScreen: React.FC<EditEntryScreenProps> = ({ entry, onBack, onSave, onDelete }) => {
    const [formState, setFormState] = useState(entry);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const title = useMemo(() => {
        if ('kind' in entry) return 'Edit Feed';
        if ('category' in entry) return 'Edit Sleep';
        if ('type' in entry) return 'Edit Diaper';
        if ('bathType' in entry) return 'Edit Bath';
        return 'Edit Entry';
    }, [entry]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        let newValue: any = value;
        if (e.target instanceof HTMLInputElement && e.target.type === 'datetime-local') {
            newValue = new Date(value);
        } else if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
            newValue = value === '' ? undefined : parseFloat(value);
        }

        setFormState(prev => ({ ...prev, [id]: newValue }));
    };

    const handleSave = () => {
        // FIX: Use a temporary variable to avoid direct state mutation.
        let entryToSave = { ...formState };

        // FIX: Use 'in' operator as a type guard to correctly narrow the union type.
        // Recalculate pump total if needed
        if ('kind' in entryToSave && entryToSave.kind === 'pump') {
            const left = entryToSave.leftAmountOz || 0;
            const right = entryToSave.rightAmountOz || 0;
            entryToSave.totalAmountOz = left + right;
        }
        onSave(entryToSave);
    };

    const handleDelete = () => {
        onDelete(entry.id);
    }

    const renderFormFields = () => {
        if ('kind' in formState) { // Feed or Pump
            if (formState.kind === 'pump') {
                const pumpState = formState as Pump;
                return (
                    <>
                        <InputField label="Start Time" id="startedAt" type="datetime-local" value={formatDateForInput(pumpState.startedAt)} onChange={handleChange} />
                        <InputField label="End Time" id="endedAt" type="datetime-local" value={formatDateForInput(pumpState.endedAt || new Date())} onChange={handleChange} />
                        <div className="flex space-x-2">
                            <InputField label="Left (oz)" id="leftAmountOz" type="number" step="0.1" value={pumpState.leftAmountOz ?? ''} onChange={handleChange} />
                            <InputField label="Right (oz)" id="rightAmountOz" type="number" step="0.1" value={pumpState.rightAmountOz ?? ''} onChange={handleChange} />
                        </div>
                    </>
                );
            }
            const feedState = formState as Feed;
             return (
                <>
                    <InputField label="Start Time" id="startedAt" type="datetime-local" value={formatDateForInput(feedState.startedAt)} onChange={handleChange} />
                    {feedState.kind === 'nursing' && <InputField label="End Time" id="endedAt" type="datetime-local" value={formatDateForInput(feedState.endedAt || new Date())} onChange={handleChange} />}
                    {feedState.kind === 'bottle' && <InputField label="Amount (oz)" id="amountOz" type="number" step="0.1" value={feedState.amountOz ?? ''} onChange={handleChange} />}
                </>
            );
        }
        if ('category' in formState) { // Sleep
            const sleepState = formState as Sleep;
            return (
                <>
                    <InputField label="Start Time" id="startedAt" type="datetime-local" value={formatDateForInput(sleepState.startedAt)} onChange={handleChange} />
                    <InputField label="End Time" id="endedAt" type="datetime-local" value={formatDateForInput(sleepState.endedAt || new Date())} onChange={handleChange} />
                </>
            );
        }
        return <p>This entry type cannot be edited yet.</p>;
    }

    return (
        <div className="fixed inset-0 bg-light-bg dark:bg-dark-bg z-50 flex flex-col p-4">
            <header className="relative flex items-center justify-center mb-6">
                <button onClick={onBack} className="absolute left-0 p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">{title}</h1>
            </header>

            <main className="flex-1 space-y-4 overflow-y-auto">
                {renderFormFields()}
                 <div>
                    <label htmlFor="note" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Notes (optional)</label>
                    <textarea
                        id="note"
                        rows={3}
                        value={formState.note ?? ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
                    />
                </div>
            </main>

            <footer className="mt-auto pt-4 space-y-2">
                {showDeleteConfirm ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center space-y-3">
                        <p className="font-semibold">Are you sure?</p>
                        <p className="text-sm text-red-800 dark:text-red-200">This action cannot be undone, but you will have a chance to restore it for a few seconds.</p>
                        <div className="flex space-x-2">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 py-2 px-4 rounded-md text-sm font-medium">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium">Yes, Delete</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setShowDeleteConfirm(true)} className="bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 text-red-500 font-bold py-3 px-4 rounded-lg transition-colors w-1/3">
                            Delete
                        </button>
                        <button onClick={handleSave} className="w-2/3 bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Save Changes
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
};