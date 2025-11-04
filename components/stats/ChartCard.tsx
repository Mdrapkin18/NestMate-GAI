import React from 'react';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg text-light-text dark:text-dark-text mb-4">{title}</h3>
            <div className="h-60 w-full">
                {children}
            </div>
        </div>
    )
};