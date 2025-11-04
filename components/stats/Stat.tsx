import React from 'react';

interface StatProps {
    label: string;
    value: string | number;
}

export const Stat: React.FC<StatProps> = ({ label, value }) => {
    return (
        <div className="bg-light-surface dark:bg-dark-surface p-3 rounded-lg shadow-sm flex-1 text-center">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{label}</p>
            <p className="text-xl font-bold text-light-text dark:text-dark-text">{value}</p>
        </div>
    )
};