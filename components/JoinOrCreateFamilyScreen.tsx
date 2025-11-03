import React, { useState } from 'react';

interface JoinOrCreateFamilyScreenProps {
  onCreateFamily: () => Promise<void>;
  onJoinFamily: (code: string) => Promise<string | null>;
}

export const JoinOrCreateFamilyScreen: React.FC<JoinOrCreateFamilyScreenProps> = ({ onCreateFamily, onJoinFamily }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            setError('Please enter an invite code.');
            return;
        }
        setError('');
        setIsLoading(true);
        const joinError = await onJoinFamily(inviteCode);
        if (joinError) {
            setError(joinError);
        }
        setIsLoading(false);
    };

    const handleCreate = async () => {
        setError('');
        setIsLoading(true);
        await onCreateFamily();
        // No need to set loading to false, as the app state will change and unmount this component
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-4 text-light-text dark:text-dark-text">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold mb-2">Join a Family</h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">
                    Enter an invite code from a family member or create a new family space.
                </p>

                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-lg space-y-4">
                    <h2 className="text-lg font-semibold">Join with Code</h2>
                    <input
                        type="text"
                        placeholder="e.g., NM-ABC-123"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary bg-light-surface dark:bg-dark-surface"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        onClick={handleJoin}
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    >
                        {isLoading ? 'Joining...' : 'Join Family'}
                    </button>
                </div>
                
                <div className="my-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-light-bg dark:bg-dark-bg text-gray-500">OR</span>
                        </div>
                    </div>
                </div>

                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-lg space-y-3">
                     <h2 className="text-lg font-semibold">Start a New Family</h2>
                     <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Create a new, private space for your baby's records and invite others to join.
                     </p>
                     <button
                        onClick={handleCreate}
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-light-text dark:text-dark-text bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create New Family'}
                    </button>
                </div>
            </div>
        </div>
    );
};