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
import { AnyEntry, TimerState, Baby, Feed, ActiveTab, BreastSide, BottleType, Diaper, Bath } from './types';
import { useAuth } from './hooks/useAuth';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './services/firebase';
import { feedSchema, sleepSchema, babySchema, diaperSchema, bathSchema } from './types';
import { AIAssistant } from './components/AIAssistant';
import { generateBabyContext } from './utils/contextHelper';
import { AIIcon } from './components/icons/AIIcon';
import { CreateBabyScreen } from './components/CreateBabyScreen';
import { JoinOrCreateFamilyScreen } from './components/JoinOrCreateFamilyScreen';
import { createFamily, acceptInvite } from './services/familyService';
import { LogDiaperScreen } from './components/LogDiaperScreen';
import { LogBathScreen } from './components/LogBathScreen';

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
    const [isLoggingDiaper, setIsLoggingDiaper] = useState(false);
    const [isLoggingBath, setIsLoggingBath] = useState(false);
    const [lastAddedEntryId, setLastAddedEntryId] = useState<string | null>(null);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    useEffect(() => {
        console.log('[App] Initializing application...');
    }, []);

    const babyContext = useMemo(() => {
        if (!activeBaby) return '';
        const context = generateBabyContext(activeBaby, entries);
        console.log('[App] Baby context updated:', context);
        return context;
    }, [activeBaby, entries]);


    // Derived state for active timer
    const activeTimer = useMemo<TimerState | null>(() => {
        const activeEntry = entries.find(e => !e.endedAt);
        if (activeEntry && ('kind' in activeEntry || 'category' in activeEntry)) {
             const timer: TimerState = {
                id: activeEntry.id,
                type: 'kind' in activeEntry ? 'feed' : 'sleep',
                startedAt: activeEntry.startedAt.getTime(),
                side: 'kind' in activeEntry && activeEntry.kind === 'nursing' ? activeEntry.side : undefined,
            };
            console.log('[App] Active timer derived from entries:', timer);
            return timer;
        }
        return null;
    }, [entries]);

    useEffect(() => {
        if (!userProfile || !userProfile.familyId) {
            if (!authLoading) {
                console.log('[App] User has no familyId, setting baby loading to false.');
                setBabyLoading(false);
            }
            setActiveBaby(null);
            return;
        }

        const loadBabyProfile = async () => {
            console.log('[App] Loading baby profile...');
            setBabyLoading(true);
            if (!userProfile.babies || userProfile.babies.length === 0) {
                console.log('[App] User has no babies associated with their profile.');
                setActiveBaby(null);
                setBabyLoading(false);
                return;
            }

            // For now, just load the first baby. A future update could support multiple.
            const babyId = userProfile.babies[0]; 
            console.log(`[App] Attempting to fetch profile for babyId: ${babyId}`);
            const babyDocRef = doc(db, 'babies', babyId);
            try {
                const babyDoc = await getDoc(babyDocRef);
                if (babyDoc.exists()) {
                    const parsedBaby = babySchema.safeParse({ id: babyDoc.id, ...babyDoc.data() });
                    if (parsedBaby.success) {
                        console.log('[App] Successfully fetched and parsed baby profile:', parsedBaby.data);
                        setActiveBaby(parsedBaby.data);
                    } else {
                        console.error("[App] Failed to parse baby data from Firestore:", parsedBaby.error);
                        setActiveBaby(null);
                    }
                } else {
                    console.warn(`[App] Baby with id ${babyId} not found in 'babies' collection.`);
                    setActiveBaby(null);
                }
            } catch (error) {
                console.error("[App] Error fetching baby profile:", error);
            } finally {
                setBabyLoading(false);
            }
        };

        loadBabyProfile();
    }, [userProfile, authLoading]);

    const handleCreateBaby = useCallback(async (babyData: { name: string; dob: Date; weightLbs?: number; weightOz?: number; heightInches?: number; }) => {
        if (!user || !userProfile || !userProfile.familyId) {
            throw new Error("User or profile not available to create baby.");
        }
        
        console.log('[App] Creating new baby with data:', babyData);

        const babyId = uuidv4();
        const newBaby: Baby = {
            id: babyId,
            familyId: userProfile.familyId,
            name: babyData.name,
            dob: babyData.dob,
            weightLbs: babyData.weightLbs,
            weightOz: babyData.weightOz,
            heightInches: babyData.heightInches,
        };

        const babyDocRef = doc(db, 'babies', babyId);
        const userDocRef = doc(db, 'users', user.uid);

        try {
            const { id, ...dataToSave } = newBaby;
            await setDoc(babyDocRef, dataToSave);
            console.log(`[App] Saved new baby document with id: ${babyId}`);
            
            await updateDoc(userDocRef, {
                babies: arrayUnion(babyId)
            });
            console.log(`[App] Updated user profile with new babyId.`);
            
            setActiveBaby(newBaby);

        } catch (error) {
            console.error("[App] Error creating baby:", error);
            throw error;
        }
    }, [user, userProfile]);

    useEffect(() => {
        if (!user || !activeBaby?.id || !userProfile?.familyId) {
            setEntries([]);
            setEntriesLoading(false);
            if(user && !activeBaby) console.log('[App] No active baby, skipping entry fetch.');
            return;
        }

        console.log(`[App] Subscribing to entries for baby: ${activeBaby.id}`);
        setEntriesLoading(true);
        const entriesRef = collection(db, "entries");
        // FIX: Secured the query by filtering on the user's familyId. This aligns
        // with Firestore security rules and resolves the 'permission-denied' error.
        // A composite index on (familyId, babyId, startedAt desc) is likely required.
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
                } else if (data.category) { // Sleep entry
                    const parsed = sleepSchema.safeParse(data);
                    if (parsed.success) fetchedEntries.push(parsed.data);
                } else if (data.type) { // Diaper entry
                    const parsed = diaperSchema.safeParse(data);
                    if (parsed.success) fetchedEntries.push(parsed.data);
                } else if (data.bathType) { // Bath entry
                    const parsed = bathSchema.safeParse(data);
                    if (parsed.success) fetchedEntries.push(parsed.data);
                }
            });
            console.log(`[App] Fetched ${fetchedEntries.length} entries from Firestore.`);
            setEntries(fetchedEntries);
            setEntriesLoading(false);
        }, (error) => {
            console.error("[App] Error fetching entries from Firestore:", error);
            setEntriesLoading(false);
        });

        return () => {
            console.log('[App] Unsubscribing from entries listener.');
            unsubscribe();
        };
    }, [user, userProfile, activeBaby?.id]);


    const triggerUndo = (entryId: string) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setLastAddedEntryId(entryId);
        console.log(`[App] Undo triggered for entryId: ${entryId}. Banner will show for 10s.`);
        undoTimeoutRef.current = setTimeout(() => setLastAddedEntryId(null), 10000);
    };

    const handleUndo = useCallback(async () => {
        if (!lastAddedEntryId) return;
        try {
            console.log(`[App] Executing undo for entryId: ${lastAddedEntryId}`);
            await deleteDoc(doc(db, "entries", lastAddedEntryId));
            setLastAddedEntryId(null);
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = null;
            }
        } catch (error) {
            console.error("[App] Error undoing entry:", error);
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
        
        console.log(`[App] Starting ${type} timer`, { side });

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
            console.log(`[App] Started timer with entryId: ${docRef.id}`);
            triggerUndo(docRef.id);
            setIsLoggingFeed(false);
            setActiveTab('home');
        } catch (error) {
            console.error(`[App] Error starting ${type} timer:`, error);
        }
    }, [activeTimer, user, activeBaby, userProfile?.familyId]);
    
    const handleStopTimer = useCallback(async () => {
        if (!activeTimer) return;
        const entryRef = doc(db, "entries", activeTimer.id);
        console.log(`[App] Stopping timer for entryId: ${activeTimer.id}`);
        try {
            await updateDoc(entryRef, {
                endedAt: new Date(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("[App] Error stopping timer:", error);
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
        
        console.log('[App] Logging bottle feed:', newEntry);

        const docPayload = {
            ...newEntry,
            startedAt: now,
            endedAt: now,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        try {
            const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
            console.log(`[App] Logged bottle feed with entryId: ${docRef.id}`);
            triggerUndo(docRef.id);
            setIsLoggingFeed(false);
            setActiveTab('home');
        } catch (error) {
            console.error("[App] Error logging bottle feed:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);
    
    const handleLogDiaper = useCallback(async (diaperData: Omit<Diaper, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt'>) => {
        if (!user || !userProfile?.familyId || !activeBaby) return;
        const now = new Date();
        const docPayload = {
            ...diaperData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            startedAt: now,
            endedAt: now,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        console.log('[App] Logging diaper change:', docPayload);
        try {
            const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
            console.log(`[App] Logged diaper change with entryId: ${docRef.id}`);
            triggerUndo(docRef.id);
            setIsLoggingDiaper(false);
        } catch (error) {
            console.error("[App] Error logging diaper change:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);

    const handleLogBath = useCallback(async (bathData: Omit<Bath, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'startedAt' | 'endedAt'>) => {
        if (!user || !userProfile?.familyId || !activeBaby) return;
        const now = new Date();
        const docPayload = {
            ...bathData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            startedAt: now,
            endedAt: now,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        console.log('[App] Logging bath:', docPayload);
        try {
            const docRef = await addDoc(collection(db, "entries"), toFirestore(docPayload));
            console.log(`[App] Logged bath with entryId: ${docRef.id}`);
            triggerUndo(docRef.id);
            setIsLoggingBath(false);
        } catch (error) {
            console.error("[App] Error logging bath:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);


    const renderContent = () => {
        if (isLoggingFeed) {
            return <StartFeedScreen onBack={() => setIsLoggingFeed(false)} onStartNursing={handleStartTimer} onLogBottle={handleLogBottle}/>;
        }
        if (isLoggingDiaper) {
            return <LogDiaperScreen onBack={() => setIsLoggingDiaper(false)} onSave={handleLogDiaper} />;
        }
        if (isLoggingBath) {
            return <LogBathScreen onBack={() => setIsLoggingBath(false)} onSave={handleLogBath} entries={entries} />;
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
                    onStartDiaperClick={() => setIsLoggingDiaper(true)}
                    onStartBathClick={() => setIsLoggingBath(true)}
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
                    onStartDiaperClick={() => setIsLoggingDiaper(true)}
                    onStartBathClick={() => setIsLoggingBath(true)}
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
    
    if (authLoading) {
        return <WelcomeScreen />;
    }

    if (!user) {
        return <Auth />;
    }

    // New user flow: direct to join/create family screen
    if (!userProfile?.familyId) {
        return <JoinOrCreateFamilyScreen 
            onCreateFamily={async () => {
                if (!user) throw new Error("User not authenticated");
                await createFamily(user.uid);
                // The onSnapshot listener in useAuth will automatically update the userProfile
            }}
            onJoinFamily={async (code: string) => {
                if (!user) throw new Error("User not authenticated");
                const result = await acceptInvite(code, user.uid);
                // The onSnapshot listener will handle the update.
                // We return the error message to the component to display.
                return result.error || null;
            }}
        />
    }

    // Existing family member, but no baby created yet
    if (babyLoading) {
        return <WelcomeScreen />;
    }

    if (!activeBaby) {
        return <CreateBabyScreen onSave={handleCreateBaby} />;
    }

    const showBottomNav = !isLoggingFeed && !isLoggingDiaper && !isLoggingBath;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="max-w-md mx-auto relative">
                <main className="pb-24">
                    {entriesLoading ? <div className="p-8 text-center">Loading entries...</div> : renderContent()}
                </main>
                
                {showBottomNav && activeTab === 'home' && !isAiAssistantOpen && (
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
                {showBottomNav && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
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