import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HomeScreen } from './components/HomeScreen';
import { Auth } from './components/Auth';
import { BottomNav } from './components/BottomNav';
import { BabyProfile } from './components/BabyProfile';
import { WelcomeScreen } from './components/WelcomeScreen';
import { StartFeedScreen } from './components/StartFeedScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { UndoBanner } from './components/UndoBanner';
import { AnyEntry, TimerState, Baby, BreastSide, ActiveTab, FeedEntry, BottleType } from './types';


// FIX: Add `as const` to string literal properties to satisfy the strict types of `AnyEntry`.
const initialEntries: AnyEntry[] = [
    { id: '1', type: 'feed' as const, mode: 'breast' as const, side: 'left' as const, startedAt: Date.now() - 3 * 60 * 60 * 1000, endedAt: Date.now() - 3 * 60 * 60 * 1000 + 10 * 60 * 1000 },
    { id: '2', type: 'sleep' as const, category: 'nap' as const, startedAt: Date.now() - 2 * 60 * 60 * 1000, endedAt: Date.now() - 2 * 60 * 60 * 1000 + 45 * 60 * 1000 },
].sort((a,b) => b.startedAt - a.startedAt);


const App: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [appState, setAppState] = useState<'splash' | 'auth' | 'main'>('splash');
    const [baby, setBaby] = useState<Baby>({
        name: 'Keegan',
        dob: '2024-05-15',
        weightKg: 4.5,
        heightCm: 55,
    });
    const [entries, setEntries] = useState<AnyEntry[]>(initialEntries);
    const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isLoggingFeed, setIsLoggingFeed] = useState(false);
    const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);
    // FIX: Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for browser compatibility.
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerUndo = (entryId: string) => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
        setLastAddedEntryId(entryId);
        undoTimeoutRef.current = setTimeout(() => {
            setLastAddedEntryId(null);
        }, 10000); // 10 seconds
    };

    const handleUndo = useCallback(() => {
        if (!lastAddedEntryId) return;
        setEntries(prev => prev.filter(entry => entry.id !== lastAddedEntryId));
        setLastAddedEntryId(null);
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
    }, [lastAddedEntryId]);


    useEffect(() => {
        const timer = setTimeout(() => setAppState('auth'), 2000); // Show splash for 2s
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const useDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        setIsDarkMode(useDark);

        const savedTimer = localStorage.getItem('activeTimer');
        if (savedTimer) {
            setActiveTimer(JSON.parse(savedTimer));
        }
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleStartTimer = useCallback((type: 'feed' | 'sleep', side?: BreastSide) => {
        if (activeTimer) {
            alert('Another timer is already active.');
            return;
        }
        const newTimer: TimerState = {
            id: uuidv4(),
            type,
            startedAt: Date.now(),
            ...(type === 'feed' && { side: side || 'left' })
        };
        setActiveTimer(newTimer);
        localStorage.setItem('activeTimer', JSON.stringify(newTimer));
        setIsLoggingFeed(false); // Close the feed screen
        setActiveTab('home'); // Go back to home screen
    }, [activeTimer]);
    
    const handleStopTimer = useCallback(() => {
        if (!activeTimer) return;

        const newEntry: AnyEntry = activeTimer.type === 'feed'
            ? {
                id: activeTimer.id,
                type: 'feed',
                mode: 'breast', // Defaulting to breast for timers
                side: activeTimer.side,
                startedAt: activeTimer.startedAt,
                endedAt: Date.now(),
            }
            : {
                id: activeTimer.id,
                type: 'sleep',
                category: 'nap',
                startedAt: activeTimer.startedAt,
                endedAt: Date.now(),
            };

        setEntries(prev => [newEntry, ...prev].sort((a,b) => b.startedAt - a.startedAt));
        triggerUndo(newEntry.id);
        setActiveTimer(null);
        localStorage.removeItem('activeTimer');
    }, [activeTimer]);

    const handleLogBottle = useCallback((amount: number, unit: 'oz' | 'ml', bottleType: BottleType) => {
        // Convert oz to ml for consistent storage
        const amountMl = unit === 'oz' ? amount * 29.5735 : amount;
        const now = Date.now();
        const newEntry: FeedEntry = {
            id: uuidv4(),
            type: 'feed',
            mode: 'bottle',
            amountMl,
            bottleType,
            startedAt: now,
            endedAt: now, // For bottle logs, start and end are the same
        };
        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startedAt - a.startedAt));
        triggerUndo(newEntry.id);
        setIsLoggingFeed(false); // Close the feed screen
        setActiveTab('home'); // Go back home
    }, []);
    
    const renderContent = () => {
        if (isLoggingFeed) {
            return <StartFeedScreen onBack={() => setIsLoggingFeed(false)} onStartNursing={handleStartTimer} onLogBottle={handleLogBottle}/>;
        }
        
        switch(activeTab) {
            case 'home':
                return <HomeScreen 
                    baby={baby} 
                    entries={entries}
                    activeTimer={activeTimer}
                    onStopTimer={handleStopTimer}
                    onStartFeedClick={() => setIsLoggingFeed(true)}
                    onStartSleepClick={() => handleStartTimer('sleep')}
                />;
            case 'feeding':
                return <StartFeedScreen onBack={() => setActiveTab('home')} onStartNursing={handleStartTimer} onLogBottle={handleLogBottle}/>;
            case 'sleep':
                 return <HomeScreen 
                    baby={baby} 
                    entries={entries}
                    activeTimer={activeTimer}
                    onStopTimer={handleStopTimer}
                    onStartFeedClick={() => setIsLoggingFeed(true)}
                    onStartSleepClick={() => handleStartTimer('sleep')}
                />;
            case 'history':
                return <HistoryScreen entries={entries} />;
            case 'settings':
                return <BabyProfile 
                    baby={baby} 
                    onUpdateBaby={setBaby} 
                    onLogout={() => setAppState('auth')}
                />;
            default:
                return null;
        }
    }
    
    if (appState === 'splash') {
        return <WelcomeScreen />;
    }

    if (appState === 'auth') {
        return <Auth onLoginSuccess={() => setAppState('main')} />;
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="max-w-md mx-auto relative">
                <main className="pb-24">
                    {renderContent()}
                </main>
                {lastAddedEntryId && <UndoBanner onUndo={handleUndo} />}
                {!isLoggingFeed && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
            </div>
        </div>
    );
};

export default App;
