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
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './services/firebase';
import { feedSchema, sleepSchema, babySchema } from './types';
import { AIAssistant } from './components/AIAssistant';
import { generateBabyContext } from './utils/contextHelper';
import { AIIcon } from './components/icons/AIIcon';
import { CreateBabyScreen } from './components/CreateBabyScreen';

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
    const { user, userProfile, loading: authLoading } = useAuth();
    
    const [activeBaby, setActiveBaby] = useState<Baby | null>(null);
    const [babyLoading, setBabyLoading] = useState(true);

    const [entries, setEntries] = useState<AnyEntry[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isLoggingFeed, setIsLoggingFeed] = useState(false);
    const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    const babyContext = useMemo(() => {
        if (!activeBaby) return '';
        return generateBabyContext(activeBaby, entries);
    }, [activeBaby, entries]);


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
        if (!userProfile) {
            if (!authLoading) {
                setBabyLoading(false);
            }
            return;
        }

        const loadBabyProfile = async () => {
            setBabyLoading(true);
            if (!userProfile.babies || userProfile.babies.length === 0) {
                setActiveBaby(null);
                setBabyLoading(false);
                return;
            }

            const babyId = userProfile.babies[0];
            const babyDocRef = doc(db, 'babies', babyId);
            try {
                const babyDoc = await getDoc(babyDocRef);
                if (babyDoc.exists()) {
                    const parsedBaby = babySchema.safeParse({ id: babyDoc.id, ...babyDoc.data() });
                    if (parsedBaby.success) {
                        setActiveBaby(parsedBaby.data);
                    } else {
                        console.error("Failed to parse baby data:", parsedBaby.error);
                        setActiveBaby(null);
                    }
                } else {
                    console.warn(`Baby with id ${babyId} not found in 'babies' collection.`);
                    setActiveBaby(null);
                }
            } catch (error) {
                console.error("Error fetching baby profile:", error);
            } finally {
                setBabyLoading(false);
            }
        };

        loadBabyProfile();
    }, [userProfile, authLoading]);

    const handleCreateBaby = useCallback(async (name: string, dob: Date) => {
        if (!user || !userProfile || !userProfile.familyId) {
            throw new Error("User or profile not available to create baby.");
        }

        const babyId = uuidv4();
        const newBaby: Baby = {
            id: babyId,
            familyId: userProfile.familyId,
            name,
            dob,
        };

        const babyDocRef = doc(db, 'babies', babyId);
        const userDocRef = doc(db, 'users', user.uid);

        try {
            const { id, ...babyData } = newBaby;
            await setDoc(babyDocRef, babyData);
            
            await updateDoc(userDocRef, {
                babies: arrayUnion(babyId)
            });
            
            setActiveBaby(newBaby);

        } catch (error) {
            console.error("Error creating baby:", error);
            throw error;
        }
    }, [user, userProfile]);

    useEffect(() => {
      if ('serviceWorker' in navigator) {
        // Construct a full URL for the service worker to prevent cross-origin errors.
        // This is more robust than a relative or absolute path in complex hosting environments.
        const swUrl = new URL('/firebase-messaging-sw.js', window.location.origin).href;
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Service Worker registered successfully with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      }
    }, []);

    useEffect(() => {
        if (!user || !activeBaby?.id || !userProfile?.familyId) {
            setEntries([]);
            setEntriesLoading(false);
            return;
        }

        setEntriesLoading(true);
        const entriesRef = collection(db, "entries");
        const q = query(
            entriesRef, 
            where("familyId", "==", userProfile.familyId),
            where("babyId", "==", activeBaby.id), 
            orderBy("startedAt", "desc")
        );

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
    }, [user, activeBaby?.id, userProfile?.familyId]);


    const triggerUndo = (entryId: string) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setLastAddedEntryId(entryId);
        undoTimeoutRef.current = setTimeout(() => setLastAddedEntryId(null), 10000);
    };

    const handleUndo = useCallback(async () => {
        if (!lastAddedEntryId) return;
        try {
            await deleteDoc(doc(db, "entries", lastAddedEntryId));
            setLastAddedEntryId(null);
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = null;
            }
        } catch (error) {
            console.error("Error undoing entry:", error);
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
        if (activeTimer || !user || !userProfile?.familyId || !activeBaby) return;

        const now = new Date();
        const newEntryData = type === 'feed' ? {
            kind: 'nursing',
            side,
        } : {
            category: 'nap', // Default
        };

        const docPayload = {
            ...newEntryData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            startedAt: now,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
            triggerUndo(docRef.id);
            setIsLoggingFeed(false);
            setActiveTab('home');
        } catch (error) {
            console.error("Error starting timer:", error);
        }
    }, [activeTimer, user, activeBaby, userProfile?.familyId]);
    
    const handleStopTimer = useCallback(async () => {
        if (!activeTimer) return;
        const entryRef = doc(db, "entries", activeTimer.id);
        try {
            await updateDoc(entryRef, {
                endedAt: new Date(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error stopping timer:", error);
        }
    }, [activeTimer]);

    const handleLogBottle = useCallback(async (amount: number, unit: 'oz' | 'ml', bottleType: BottleType) => {
        if (!user || !userProfile?.familyId || !activeBaby) return;
        const amountOz = unit === 'ml' ? amount / 29.5735 : amount;
        const now = new Date();
        const newEntry: Omit<Feed, 'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt'> = {
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
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
        try {
            const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
            triggerUndo(docRef.id);
            setIsLoggingFeed(false);
            setActiveTab('home');
        } catch (error) {
            console.error("Error logging bottle:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);
    
    const renderContent = () => {
        if (isLoggingFeed) {
            return <StartFeedScreen onBack={() => setIsLoggingFeed(false)} onStartNursing={handleStartTimer} onLogBottle={handleLogBottle}/>;
        }
        
        switch(activeTab) {
            case 'home':
                return <HomeScreen 
                    baby={activeBaby!} 
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
                    baby={activeBaby!} 
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
                    baby={activeBaby!} 
                    onUpdateBaby={setActiveBaby} 
                />;
            default:
                return null;
        }
    }
    
    if (authLoading || babyLoading) {
        return <WelcomeScreen />;
    }

    if (!user) {
        return <Auth />;
    }

    if (!activeBaby) {
        return <CreateBabyScreen onSave={handleCreateBaby} />;
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="max-w-md mx-auto relative">
                <main className="pb-24">
                    {entriesLoading ? <div className="p-8 text-center">Loading entries...</div> : renderContent()}
                </main>
                
                {!isLoggingFeed && !isAiAssistantOpen && activeTab === 'home' && (
                    <button
                        onClick={() => setIsAiAssistantOpen(true)}
                        className="fixed bottom-24 right-4 z-40 bg-primary hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 animate-pulse-slow"
                        aria-label="Open AI Assistant"
                    >
                        <AIIcon className="w-8 h-8" />
                    </button>
                )}
                
                {isAiAssistantOpen && <AIAssistant onClose={() => setIsAiAssistantOpen(false)} babyContext={babyContext} />}

                {lastAddedEntryId && <UndoBanner onUndo={handleUndo} />}
                {!isLoggingFeed && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
            </div>
             <style>{`
                @keyframes pulse-slow {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(127, 86, 217, 0.7);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 0 10px rgba(127, 86, 217, 0);
                    }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default App;