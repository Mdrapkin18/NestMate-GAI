import React, { useState, useEffect } from 'react';
import { Pump } from '../types';
import { useTimer } from '../hooks/useTimer';
import { formatDuration } from '../utils/helpers';
import { PumpIcon } from './icons/PumpIcon';

type PumpData = Omit<Pump, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'kind'>;

interface LogPumpScreenProps {
  onBack: () => void;
  onSave: (data: PumpData) => void;
}

const AmountInput: React.FC<{label: string, value: string, onChange: (val: string) => void}> = ({ label, value, onChange }) => (
    <div className="flex-1">
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text pr-10"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm">oz</span>
        </div>
    </div>
);

export const LogPumpScreen: React.FC<LogPumpScreenProps> = ({ onBack, onSave }) => {
    const { isActive, elapsed, start, stop, startedAt } = useTimer(null);
    const [leftAmount, setLeftAmount] = useState('');
    const [rightAmount, setRightAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('0.0');
    const [note, setNote] = useState('');

    useEffect(() => {
        const left = parseFloat(leftAmount) || 0;
        const right = parseFloat(rightAmount) || 0;
        setTotalAmount((left + right).toFixed(1));
    }, [leftAmount, rightAmount]);

    const handleSave = () => {
        if (!startedAt) {
            alert("Please start the timer before saving.");
            return;
        }

        const saveData: PumpData = {
            startedAt: new Date(startedAt),
            endedAt: new Date(),
            leftAmountOz: leftAmount ? parseFloat(leftAmount) : undefined,
            rightAmountOz: rightAmount ? parseFloat(rightAmount) : undefined,
            totalAmountOz: totalAmount ? parseFloat(totalAmount) : undefined,
        };
        if (note.trim()) saveData.note = note.trim();
        
        onSave(saveData);
    };
    
    return (
        <div className="fixed inset-0 bg-light-bg dark:bg-dark-bg z-50 flex flex-col p-4">
            <header className="relative flex items-center justify-center mb-6">
                <button onClick={onBack} className="absolute left-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Log Pumping</h1>
            </header>

            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                <PumpIcon className="w-16 h-16 text-primary" />
                <p className="text-6xl font-bold tracking-wider">{formatDuration(elapsed)}</p>
                 <button 
                    onClick={isActive ? stop : start}
                    className={`w-24 h-24 rounded-full text-white font-bold text-lg flex items-center justify-center transition-colors ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-700'}`}
                >
                    {isActive ? 'STOP' : 'START'}
                </button>
            </div>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-sm space-y-6">
                 <div className="flex space-x-4">
                    <AmountInput label="Left" value={leftAmount} onChange={setLeftAmount} />
                    <AmountInput label="Right" value={rightAmount} onChange={setRightAmount} />
                 </div>
                 <div className="text-center">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Amount</p>
                    <p className="text-2xl font-bold">{totalAmount} oz</p>
                 </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Notes (optional)</label>
                    <textarea
                        id="notes"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
                        placeholder="e.g., used hospital grade pump..."
                    />
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={!isActive}
                    className="w-full bg-primary hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400"
                >
                    Save Pump Session
                </button>
            </div>
        </div>
    );
};