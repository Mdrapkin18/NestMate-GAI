import React from 'react';
import { ActiveTab } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { FeedingIcon } from './icons/FeedingIcon';
import { SleepIcon } from './icons/SleepIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface BottomNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const NavItem: React.FC<React.PropsWithChildren<{isActive: boolean; onClick: () => void, label: string}>> = ({ isActive, onClick, children, label }) => {
    const activeClass = 'text-primary';
    const inactiveClass = 'text-gray-400 dark:text-gray-500';
    
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-colors ${isActive ? activeClass : inactiveClass} hover:text-primary`}>
            {children}
            <span className={`text-xs font-medium`}>{label}</span>
        </button>
    );
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 h-20 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center">
                <NavItem label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')}>
                    <HomeIcon className="w-7 h-7" />
                </NavItem>
                <NavItem label="Feeding" isActive={activeTab === 'feeding'} onClick={() => setActiveTab('feeding')}>
                    <FeedingIcon className="w-7 h-7" />
                </NavItem>
                <NavItem label="Sleep" isActive={activeTab === 'sleep'} onClick={() => setActiveTab('sleep')}>
                    <SleepIcon className="w-7 h-7" />
                </NavItem>
                <NavItem label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                    <HistoryIcon className="w-7 h-7" />
                </NavItem>
                 <NavItem label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                    <SettingsIcon className="w-7 h-7" />
                </NavItem>
            </div>
        </footer>
    );
};