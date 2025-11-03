import React from 'react';

interface FamilyScreenProps {
  onBack: () => void;
}

const MemberItem: React.FC<{name: string, role: string}> = ({name, role}) => (
    <div className="p-4">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{role}</p>
    </div>
);

const LabeledDisplay: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-light-bg dark:bg-dark-bg">
        <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</label>
        <p className="font-medium font-mono">{value}</p>
    </div>
);

export const FamilyScreen: React.FC<FamilyScreenProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <header className="relative flex items-center justify-center">
        <button onClick={onBack} className="absolute left-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Family & Caregivers</h1>
      </header>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Members</h2>
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
            <MemberItem name="Matthew" role="Admin" />
            <MemberItem name="McKenna Joan" role="Admin" />
            <MemberItem name="Grandma Joan" role="Caregiver" />
        </div>
      </div>

       <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg">Invite a caregiver</h2>
            <div className="space-y-3">
                <LabeledDisplay label="Shareable code" value="NM-8K1-KEEGAN" />
                <LabeledDisplay label="Invite link" value="nestmate.app/join/NM-8K1-KEEGAN" />
            </div>
            <div className="flex space-x-3">
                <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg transition-colors">
                    Copy link
                </button>
                 <button className="flex-1 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                    Regenerate code
                </button>
            </div>
        </div>

    </div>
  );
};
