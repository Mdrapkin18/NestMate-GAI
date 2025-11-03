import React, { useState } from 'react';

interface CreateBabyScreenProps {
  onSave: (name: string, dob: Date) => Promise<void>;
}

export const CreateBabyScreen: React.FC<CreateBabyScreenProps> = ({ onSave }) => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim() || !dob) {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            // DOB string from input is YYYY-MM-DD, new Date() will parse it correctly in UTC.
            await onSave(name, new Date(dob + 'T00:00:00'));
        } catch (e) {
            setError('Could not save baby profile. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 text-light-text dark:text-dark-text">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">Let's create a profile for your baby.</p>

                <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-2xl shadow-lg space-y-4">
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
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    >
                        {isLoading ? 'Saving...' : 'Save and Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};
