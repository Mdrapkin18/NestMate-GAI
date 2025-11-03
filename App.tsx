import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HomeScreen } from './components/HomeScreen';
import { Auth } from './components/Auth';
import { BottomNav } from './components/BottomNav';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { StartFeedScreen } from './components/StartFeedScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { UndoBanner } from './components/UndoBanner';
import { AnyEntry, TimerState, Baby, Feed, ActiveTab, BreastSide, BottleType } from './types';
import { useAuth } from './hooks/useAuth';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import { feedSchema, sleepSchema } from './types';

// Helper to convert our app objects to what Firestore expects (e.g., handling dates)
const toFirestore = (data: any) => {
    const firestoreData: { [key: string]: any } = {};
    for (const key in data) {
        // Exclude id, which is the doc name, not a field
        if (key === 'id') continue;
        if (data[key] instanceof Date) {
            firestoreData[key] = data[key]; // Firestore SDK handles Date objects
        } else if (data[key] !== undefined) {
            firestoreData[key] = data[key];
        }
    }
    return firestoreData;
};


const App: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { user, loading: authLoading } = useAuth();
    
    // This will be replaced by a proper baby selection UI
    const [baby, setBaby] = useState<Baby>({
        id: 'mock-baby-id-1',
        familyId: 'mock-family-id-1',
        name: 'Keegan',
        dob: new Date('2024-05-15'),
    });

    const [entries, setEntries] = useState<AnyEntry[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isLoggingFeed, setIsLoggingFeed] = useState(false);
    const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Derived state for active timer
    const activeTimer = useMemo<TimerState | null>(() => {
        const activeEntry = entries.find(e => !e.endedAt);
        if (activeEntry) {
            return {
                id: activeEntry.id,
                type: 'kind' in activeEntry ? 'feed' : 'sleep',
                startedAt: activeEntry.startedAt.getTime(),
                side: 'kind' in activeEntry && activeEntry.kind === 'nursing' ? activeEntry.side : undefined,
            };
        }
        return null;
    }, [entries]);

    useEffect(() => {
        if (!user || !baby?.id) {
            setEntries([]);
            setEntriesLoading(false);
            return;
        }
        setEntriesLoading(true);
        const entriesRef = collection(db, "entries");
        const q = query(entriesRef, where("babyId", "==", baby.id), orderBy("startedAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedEntries: AnyEntry[] = [];
            querySnapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                if (data.kind) { // Feed entry
                    const parsed = feedSchema.safeParse(data);
                    if (parsed.success) fetchedEntries.push(parsed.data);
                } else { // Sleep entry
                    const parsed = sleepSchema.safeParse(data);
                    if (parsed.success) fetchedEntries.push(parsed.data);
                }
            });
            setEntries(fetchedEntries);
            setEntriesLoading(false);
        }, (error) => {
            console.error("Error fetching entries:", error);
            setEntriesLoading(false);
        });

        return () => unsubscribe();
    }, [user, baby?.id]);


    const triggerUndo = (entryId: string) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setLastAddedEntryId(entryId);
        undoTimeoutRef.current = setTimeout(() => setLastAddedEntryId(null), 10000);
    };

    const handleUndo = useCallback(async () => {
        if (!lastAddedEntryId) return;
        await deleteDoc(doc(db, "entries", lastAddedEntryId));
        setLastAddedEntryId(null);
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
    }, [lastAddedEntryId]);


    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const handleStartTimer = useCallback(async (type: 'feed' | 'sleep', side?: BreastSide) => {
        if (activeTimer || !user) return;

        const now = new Date();
        const newEntryData = type === 'feed' ? {
            kind: 'nursing',
            side,
        } : {
            category: 'nap', // Default
        };

        const docPayload = {
            ...newEntryData,
            babyId: baby.id,
            startedAt: now,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
        triggerUndo(docRef.id);
        setIsLoggingFeed(false);
        setActiveTab('home');
    }, [activeTimer, user, baby?.id]);
    
    const handleStopTimer = useCallback(async () => {
        if (!activeTimer) return;
        const entryRef = doc(db, "entries", activeTimer.id);
        await updateDoc(entryRef, {
            endedAt: new Date(),
            updatedAt: serverTimestamp(),
        });
    }, [activeTimer]);

    const handleLogBottle = useCallback(async (amount: number, unit: 'oz' | 'ml', bottleType: BottleType) => {
        if (!user) return;
        const amountOz = unit === 'ml' ? amount / 29.5735 : amount;
        const now = new Date();
        const newEntry: Omit<Feed, 'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt'> = {
            babyId: baby.id,
            kind: 'bottle',
            amountOz,
            createdBy: user.uid,
        };
        
        const docPayload = {
            ...newEntry,
            startedAt: now,
            endedAt: now,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
        triggerUndo(docRef.id);
        setIsLoggingFeed(false);
        setActiveTab('home');
    }, [baby?.id, user]);
    
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
                />;
            default:
                return null;
        }
    }
    
    if (authLoading) {
        return <WelcomeScreen />;
    }

    if (!user) {
        return <Auth />;
    }

    if (!baby) {
        // In a real app, this would be a "Create your first baby profile" screen
        return <div className="p-8 text-center">Please set up a baby profile in settings.</div>
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="max-w-md mx-auto relative">
                <main className="pb-24">
                    {entriesLoading ? <div className="p-8 text-center">Loading entries...</div> : renderContent()}
                </main>
                {lastAddedEntryId && <UndoBanner onUndo={handleUndo} />}
                {!isLoggingFeed && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
            </div>
        </div>
    );
};

export default App;
