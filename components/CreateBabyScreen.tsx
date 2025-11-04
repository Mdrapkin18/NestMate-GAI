import React, { useState } from 'react';

interface CreateBabyScreenProps {
  onSave: (babyData: { name: string; dob: Date; weightLbs?: number; weightOz?: number; heightInches?: number; }) => Promise<void>;
}

export const CreateBabyScreen: React.FC<CreateBabyScreenProps> = ({ onSave }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [weightLbs, setWeightLbs] = useState('');
    const [weightOz, setWeightOz] = useState('');
    const [heightInches, setHeightInches] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = () => {
        if (!name.trim() || !dob) {
            setError('Please fill out name and date of birth.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);
        try {
            const parsedLbs = weightLbs ? parseFloat(weightLbs) : undefined;
            const parsedOz = weightOz ? parseFloat(weightOz) : undefined;
            const parsedHeight = heightInches ? parseFloat(heightInches) : undefined;

            await onSave({
                name,
                dob: new Date(dob + 'T00:00:00'),
                weightLbs: parsedLbs,
                weightOz: parsedOz,
                heightInches: parsedHeight
            });
        } catch (e) {
            setError('Could not save baby profile. Please try again.');
            console.error(e);
            setIsLoading(false);
        }
        // On success, isLoading will remain true as the component unmounts
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 text-light-text dark:text-dark-text">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold mb-2">
                    {step === 1 ? 'Welcome!' : 'Just a few more details'}
                </h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">
                    {step === 1 ? "Let's create a profile for your baby." : "You can add or update these details later."}
                </p>

                <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-2xl shadow-lg space-y-4">
                    {step === 1 && (
                        <>
                            <input
                                type="text"
                                placeholder="Baby's Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-surface dark:bg-dark-surface"
                            />
                            <div>
                                <label htmlFor="dob" className="block text-sm font-medium text-left text-light-text-secondary dark:text-dark-text-secondary mb-1">Date of Birth</label>
                                <input
                                    id="dob"
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-surface dark:bg-dark-surface"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button
                                onClick={handleNext}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Next
                            </button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-left text-light-text-secondary dark:text-dark-text-secondary mb-1">
                                    Birth Weight (optional)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input type="number" placeholder="lbs" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                                    <input type="number" placeholder="oz" value={weightOz} onChange={e => setWeightOz(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="height" className="block text-sm font-medium text-left text-light-text-secondary dark:text-dark-text-secondary mb-1">
                                    Birth Height (optional)
                                </label>
                                <div className="relative">
                                     <input id="height" type="number" placeholder="Height" value={heightInches} onChange={e => setHeightInches(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm pr-10" />
                                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-sm">in</span>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                            >
                                {isLoading ? 'Saving...' : 'Save and Finish'}
                            </button>
                             <button
                                onClick={() => setStep(1)}
                                className="text-sm font-medium text-primary hover:text-primary-700"
                            >
                                Back
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};