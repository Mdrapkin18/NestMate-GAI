import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HomeScreen } from './components/HomeScreen';
import { Auth } from './components/Auth';
import { BottomNav } from './components/BottomNav';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { StartFeedScreen } from './components/StartFeedScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { UndoBanner } from './components/UndoBanner';
// Fix: Import 'Feed' instead of 'FeedEntry' and consolidate imports
import { AnyEntry, TimerState, Baby, BreastSide, ActiveTab, BottleType, Feed } from './types';

// This is a mock of what would come from Firebase
const initialEntries: AnyEntry[] = [
    // Reworking mocks to be compatible with new Zod types (using Date objects)
    // Note: This data will eventually be fetched from Firestore
].sort((a,b) => b.startedAt.getTime() - a.startedAt.getTime());


const App: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [appState, setAppState] = useState<'splash' | 'auth' | 'main'>('splash');
    const [baby, setBaby] = useState<Baby>({
        id: uuidv4(),
        familyId: uuidv4(),
        name: 'Keegan',
        dob: new Date('2024-05-15'),
    });
    const [entries, setEntries] = useState<AnyEntry[]>(initialEntries);
    const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isLoggingFeed, setIsLoggingFeed] = useState(false);
    const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);
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
        const timer = setTimeout(() => setAppState('auth'), 2000);
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
        setIsLoggingFeed(false);
        setActiveTab('home');
    }, [activeTimer]);
    
    const handleStopTimer = useCallback(() => {
        if (!activeTimer) return;

        const now = new Date();
        const startedAt = new Date(activeTimer.startedAt);
        
        const newEntry: AnyEntry = activeTimer.type === 'feed'
            ? {
                id: activeTimer.id,
                babyId: baby.id,
                kind: 'nursing',
                side: activeTimer.side,
                startedAt,
                endedAt: now,
                createdBy: 'user-id-placeholder',
                createdAt: now,
                updatedAt: now,
            }
            : {
                id: activeTimer.id,
                babyId: baby.id,
                category: 'nap', // Defaulting
                startedAt,
                endedAt: now,
                createdBy: 'user-id-placeholder',
                createdAt: now,
                updatedAt: now,
            };

        setEntries(prev => [newEntry, ...prev].sort((a,b) => b.startedAt.getTime() - a.startedAt.getTime()));
        triggerUndo(newEntry.id);
        setActiveTimer(null);
        localStorage.removeItem('activeTimer');
    }, [activeTimer, baby.id]);

    const handleLogBottle = useCallback((amount: number, unit: 'oz' | 'ml', bottleType: BottleType) => {
        // Zod schema expects amountOz. In a real app, you'd handle unit conversion properly.
        const amountOz = unit === 'ml' ? amount / 29.5735 : amount;
        const now = new Date();

        // Fix: Use the imported 'Feed' type
        const newEntry: Feed = {
            id: uuidv4(),
            babyId: baby.id,
            kind: 'bottle',
            amountOz,
            startedAt: now,
            endedAt: now, // For bottle logs, start and end are the same
            createdBy: 'user-id-placeholder',
            createdAt: now,
            updatedAt: now,
        };
        setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()));
        triggerUndo(newEntry.id);
        setIsLoggingFeed(false);
        setActiveTab('home');
    }, [baby.id]);
    
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
                return <SettingsScreen 
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
