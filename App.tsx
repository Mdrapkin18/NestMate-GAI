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
import { AnyEntry, TimerState, Baby, Feed, ActiveTab, BreastSide, BottleType, Diaper, Bath, Pump } from './types';
import { useAuth } from './hooks/useAuth';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, setDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from './services/firebase';
import { feedSchema, sleepSchema, babySchema, diaperSchema, bathSchema, pumpSchema } from './types';
import { AIAssistant } from './components/AIAssistant';
import { generateBabyContext } from './utils/contextHelper';
import { AIIcon } from './components/icons/AIIcon';
import { CreateBabyScreen } from './components/CreateBabyScreen';
import { JoinOrCreateFamilyScreen } from './components/JoinOrCreateFamilyScreen';
import { createFamily, acceptInvite } from './services/familyService';
import { LogDiaperScreen } from './components/LogDiaperScreen';
import { LogBathScreen } from './components/LogBathScreen';
import { LogPumpScreen } from './components/LogPumpScreen';
import { EditEntryScreen } from './components/EditEntryScreen';

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

type ModalView = 'none' | 'logFeed' | 'logDiaper' | 'logBath' | 'logPump' | 'editEntry';


const App: React.FC = () => {
    const { user, userProfile, loading: authLoading } = useAuth();
    
    const [activeBaby, setActiveBaby] = useState<Baby | null>(null);
    const [babyLoading, setBabyLoading] = useState(true);

    const [entries, setEntries] = useState<AnyEntry[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    
    const [modalView, setModalView] = useState<ModalView>('none');
    const [selectedEntry, setSelectedEntry] = useState<AnyEntry | null>(null);

    const [lastDeletedEntry, setLastDeletedEntry] = useState<AnyEntry | null>(null);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

    useEffect(() => {
        console.log('[App] Initializing application...');
    }, []);

    const babyContext = useMemo(() => {
        if (!activeBaby) return '';
        const context = generateBabyContext(activeBaby, entries);
        console.log('[App] Baby context updated.');
        return context;
    }, [activeBaby, entries]);


    // Derived state for active timer
    const activeTimer = useMemo<TimerState | null>(() => {
        const activeEntry = entries.find(e => !e.endedAt);
        if (activeEntry && ('kind' in activeEntry || 'category' in activeEntry)) {
             const timer: TimerState = {
                id: activeEntry.id,
                type: 'kind' in activeEntry ? (activeEntry.kind === 'pump' ? 'pump' : 'feed') : 'sleep',
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
            const batch = writeBatch(db);
            const { id, ...dataToSave } = newBaby;
            batch.set(babyDocRef, dataToSave);
            console.log(`[App] Staged new baby document with id: ${babyId}`);
            
            batch.update(userDocRef, {
                babies: arrayUnion(babyId)
            });
            console.log(`[App] Staged update to user profile with new babyId.`);

            await batch.commit();
            console.log('[App] Batch commit successful for new baby.');
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
                
                let parsed: any;
                if (data.kind === 'pump') {
                    parsed = pumpSchema.safeParse(data);
                } else if (data.kind) { // Feed entry
                    parsed = feedSchema.safeParse(data);
                } else if (data.category) { // Sleep entry
                    parsed = sleepSchema.safeParse(data);
                } else if (data.type) { // Diaper entry
                    parsed = diaperSchema.safeParse(data);
                } else if (data.bathType) { // Bath entry
                    parsed = bathSchema.safeParse(data);
                }

                if (parsed && parsed.success) {
                    fetchedEntries.push(parsed.data);
                } else if (parsed) {
                    console.warn(`[App] Failed to parse an entry from Firestore:`, parsed.error);
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


    const triggerUndo = (deletedEntry: AnyEntry) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setLastDeletedEntry(deletedEntry);
        console.log(`[App] Undo triggered for entryId: ${deletedEntry.id}. Banner will show for 10s.`);
        undoTimeoutRef.current = setTimeout(() => setLastDeletedEntry(null), 10000);
    };

    const handleUndo = useCallback(async () => {
        if (!lastDeletedEntry) return;
        const entryToRestore = { ...lastDeletedEntry };
        const entryId = entryToRestore.id;
        console.log(`[App] Executing undo for entryId: ${entryId}`);
        try {
            const { id, ...dataToSave } = entryToRestore;
            await setDoc(doc(db, "entries", entryId), toFirestore(dataToSave));
            setLastDeletedEntry(null);
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = null;
            }
        } catch (error) {
            console.error("[App] Error undoing entry:", error);
        }
    }, [lastDeletedEntry]);

    const handleStartTimer = useCallback(async (type: 'feed' | 'sleep' | 'pump', side?: BreastSide) => {
        if (activeTimer || !user || !userProfile?.familyId || !activeBaby) return;

        const now = new Date();
        let newEntryData;
        if (type === 'feed') {
            newEntryData = { kind: 'nursing', side };
        } else if (type === 'sleep') {
            newEntryData = { category: 'nap' }; // Default
        } else { // pump
            newEntryData = { kind: 'pump' };
        }
        
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
            await addDoc(collection(db, "entries"), toFirestore(docPayload));
            console.log(`[App] Started timer entry successfully.`);
            setModalView('none');
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
    
    const addEntry = useCallback(async (entryData: Omit<AnyEntry, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !userProfile?.familyId || !activeBaby) return;

        const docPayload = {
            ...entryData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        console.log('[App] Adding new entry:', docPayload);
        try {
            await addDoc(collection(db, "entries"), toFirestore(docPayload));
            console.log(`[App] Successfully added new entry.`);
            setModalView('none');
            setActiveTab('home');
        } catch (error) {
            console.error("[App] Error adding entry:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);
    
    const handleUpdateEntry = useCallback(async (updatedEntry: AnyEntry) => {
        console.log(`[App] Updating entry ${updatedEntry.id}:`, updatedEntry);
        try {
            const entryRef = doc(db, 'entries', updatedEntry.id);
            const { id, ...dataToSave } = updatedEntry;
            await updateDoc(entryRef, {
                ...toFirestore(dataToSave),
                updatedAt: serverTimestamp()
            });
            console.log(`[App] Successfully updated entry.`);
            setModalView('none');
            setSelectedEntry(null);
        } catch (error) {
            console.error(`[App] Error updating entry ${updatedEntry.id}:`, error);
        }
    }, []);

    const handleDeleteEntry = useCallback(async (entryId: string) => {
        const entryToDelete = entries.find(e => e.id === entryId);
        if (!entryToDelete) return;
        console.log(`[App] Deleting entry ${entryId}:`, entryToDelete);
        try {
            await deleteDoc(doc(db, "entries", entryId));
            console.log(`[App] Successfully deleted entry.`);
            setModalView('none');
            setSelectedEntry(null);
            triggerUndo(entryToDelete);
        } catch (error) {
            console.error(`[App] Error deleting entry ${entryId}:`, error);
        }
    }, [entries]);


    const renderContent = () => {
        switch(modalView) {
            case 'logFeed':
                // FIX: Explicitly type the new entry object to satisfy the discriminated union type expected by `addEntry`.
                return <StartFeedScreen onBack={() => setModalView('none')} onStartNursing={handleStartTimer} onLogBottle={(amount, _, type) => {
                    const now = new Date();
                    const newEntry: Omit<Feed, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt'> = { kind: 'bottle', amountOz: amount, startedAt: now, endedAt: now };
                    addEntry(newEntry);
                }}/>;
            case 'logDiaper':
                return <LogDiaperScreen onBack={() => setModalView('none')} onSave={(data) => {
                    const now = new Date();
                    addEntry({ ...data, startedAt: now, endedAt: now });
                }} />;
            case 'logBath':
                return <LogBathScreen onBack={() => setModalView('none')} onSave={(data) => {
                     const now = new Date();
                    addEntry({ ...data, startedAt: now, endedAt: now });
                }} entries={entries} />;
            case 'logPump':
                 // FIX: Explicitly type the new entry object to satisfy the discriminated union type expected by `addEntry`.
                 return <LogPumpScreen onBack={() => setModalView('none')} onSave={(data) => {
                    const newEntry: Omit<Pump, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt'> = { kind: 'pump', ...data };
                    addEntry(newEntry);
                }} />;
            case 'editEntry':
                return <EditEntryScreen 
                            entry={selectedEntry!} 
                            onBack={() => { setModalView('none'); setSelectedEntry(null); }}
                            onSave={handleUpdateEntry}
                            onDelete={handleDeleteEntry}
                        />
            default:
                // No modal, render tab content
                break;
        }
        
        switch(activeTab) {
            case 'home':
                return <HomeScreen 
                    baby={activeBaby!} 
                    entries={entries}
                    activeTimer={activeTimer}
                    onStopTimer={handleStopTimer}
                    onStartFeedClick={() => setModalView('logFeed')}
                    onStartSleepClick={() => handleStartTimer('sleep')}
                    onStartDiaperClick={() => setModalView('logDiaper')}
                    onStartBathClick={() => setModalView('logBath')}
                    onStartPumpClick={() => setModalView('logPump')}
                />;
            case 'history':
                return <HistoryScreen entries={entries} onSelectEntry={(entry) => {
                    setSelectedEntry(entry);
                    setModalView('editEntry');
                }} />;
            case 'settings':
                return <SettingsScreen 
                    baby={activeBaby!} 
                    onUpdateBaby={setActiveBaby} 
                />;
            default:
                // Fallback to home for other tabs for now
                 return <HomeScreen 
                    baby={activeBaby!} 
                    entries={entries}
                    activeTimer={activeTimer}
                    onStopTimer={handleStopTimer}
                    onStartFeedClick={() => setModalView('logFeed')}
                    onStartSleepClick={() => handleStartTimer('sleep')}
                    onStartDiaperClick={() => setModalView('logDiaper')}
                    onStartBathClick={() => setModalView('logBath')}
                    onStartPumpClick={() => setModalView('logPump')}
                />;
        }
    }
    
    if (authLoading) {
        return <WelcomeScreen />;
    }

    if (!user) {
        return <Auth />;
    }

    if (!userProfile?.familyId) {
        return <JoinOrCreateFamilyScreen 
            onCreateFamily={async () => {
                if (!user) throw new Error("User not authenticated");
                await createFamily(user.uid);
            }}
            onJoinFamily={async (code: string) => {
                if (!user) throw new Error("User not authenticated");
                const result = await acceptInvite(code, user.uid);
                return result.error || null;
            }}
        />
    }

    if (babyLoading) {
        return <WelcomeScreen />;
    }

    if (!activeBaby) {
        return <CreateBabyScreen onSave={handleCreateBaby} />;
    }

    const showBottomNav = modalView === 'none';

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="max-w-md mx-auto relative">
                <main className={showBottomNav ? "pb-24" : ""}>
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

                {lastDeletedEntry && <UndoBanner onUndo={handleUndo} />}
                {showBottomNav && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
            </div>
        </div>
    );
};

export default App;