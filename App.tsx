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
import { AnyEntry, TimerState, Baby, Feed, ActiveTab, BreastSide, BottleType, Diaper, Bath, Pump, UserProfile } from './types';
import { useAuth } from './hooks/useAuth';
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
import { StatsScreen } from './components/StatsScreen';
import { FirestoreDataProvider } from './src/adapters/firestore/FirestoreDataProvider';
import { useTheme } from './hooks/useTheme';

const dataProvider = new FirestoreDataProvider();

type ModalView = 'none' | 'logFeed' | 'logDiaper' | 'logBath' | 'logPump' | 'editEntry';

const App: React.FC = () => {
    // FIX: Get userProfile from useAuth hook
    const { user, userProfile, loading: authLoading } = useAuth();
    const { isDarkMode, setIsDarkMode } = useTheme();

    const [profileLoading, setProfileLoading] = useState(true);
    
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

    // Effect to set profile loading state based on auth loading
    useEffect(() => {
        setProfileLoading(authLoading);
    }, [authLoading]);
    
    const babyContext = useMemo(() => {
        if (!activeBaby) return '';
        const context = generateBabyContext(activeBaby, entries);
        return context;
    }, [activeBaby, entries]);

    // FIX: Refactor activeTimer logic to be type-safe
    const activeTimer = useMemo<TimerState | null>(() => {
        const activeEntry = entries.find(e => !e.endedAt);
        if (!activeEntry) {
            return null;
        }

        if (activeEntry.type === 'feed' && activeEntry.kind === 'nursing') {
            return {
                id: activeEntry.id,
                type: 'feed',
                startedAt: activeEntry.startedAt.getTime(),
                side: activeEntry.side,
            };
        }
        if (activeEntry.type === 'sleep') {
            return {
                id: activeEntry.id,
                type: 'sleep',
                startedAt: activeEntry.startedAt.getTime(),
            };
        }
        if (activeEntry.type === 'pump') {
            return {
                id: activeEntry.id,
                type: 'pump',
                startedAt: activeEntry.startedAt.getTime(),
            };
        }
        return null;
    }, [entries]);

    // Effect to load baby profile
    useEffect(() => {
        if (!userProfile || !userProfile.familyId) {
            if (!profileLoading) {
                setBabyLoading(false);
            }
            setActiveBaby(null);
            return;
        }

        const loadBabyProfile = async () => {
            setBabyLoading(true);
            const babies = await dataProvider.listBabies(userProfile.familyId!);
            if (babies.length > 0) {
                setActiveBaby(babies[0]);
            } else {
                setActiveBaby(null);
            }
            setBabyLoading(false);
        };

        loadBabyProfile();
    }, [userProfile, profileLoading]);

    // Effect to listen for entries
    useEffect(() => {
        if (!user || !activeBaby?.id || !userProfile?.familyId) {
            setEntries([]);
            setEntriesLoading(false);
            return;
        }
        setEntriesLoading(true);
        const unsubscribe = dataProvider.listenToEntries({
            familyId: userProfile.familyId,
            babyId: activeBaby.id,
        }, (updatedEntries) => {
            setEntries(updatedEntries);
            setEntriesLoading(false);
        });

        return () => unsubscribe();
    }, [user, userProfile?.familyId, activeBaby?.id]);


    const handleCreateBaby = useCallback(async (babyData: { name: string; dob: Date; weightLbs?: number; weightOz?: number; heightInches?: number; }) => {
        if (!user || !userProfile || !userProfile.familyId) {
            throw new Error("User or profile not available to create baby.");
        }
        
        const newBabyData: Omit<Baby, 'id'> = {
            familyId: userProfile.familyId,
            name: babyData.name,
            dob: babyData.dob,
            // FIX: Add schemaVersion to align with type definition
            schemaVersion: 2,
        };

        try {
            const babyId = await dataProvider.createBaby(newBabyData, user.uid);
            const createdBaby = await dataProvider.getBaby(babyId);
            if(createdBaby) setActiveBaby(createdBaby);
        } catch (error) {
            console.error("[App] Error creating baby:", error);
            throw error;
        }
    }, [user, userProfile]);

    const handleSaveBaby = useCallback(async (updatedBaby: Baby) => {
        try {
            await dataProvider.updateBaby(updatedBaby.id, updatedBaby);
            setActiveBaby(updatedBaby);
        } catch (error) {
            console.error("[App] Error saving baby profile:", error);
            throw error; // Re-throw so the form can show an error
        }
    }, []);

    const triggerUndo = (deletedEntry: AnyEntry) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setLastDeletedEntry(deletedEntry);
        undoTimeoutRef.current = setTimeout(() => setLastDeletedEntry(null), 10000);
    };

    const handleUndo = useCallback(async () => {
        if (!lastDeletedEntry) return;
        try {
            await dataProvider.restoreEntry(lastDeletedEntry);
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
            newEntryData = { type: 'feed', kind: 'nursing', side, startedAt: now };
        } else if (type === 'sleep') {
            newEntryData = { type: 'sleep', category: 'nap', startedAt: now };
        } else { // pump
            newEntryData = { type: 'pump', kind: 'pump', startedAt: now, totalAmountOz: 0 };
        }

        const docPayload = {
            ...newEntryData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            createdBy: user.uid,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 2,
        };

        try {
            await dataProvider.createEntry(docPayload as Omit<AnyEntry, 'id'>);
            setModalView('none');
            setActiveTab('home');
        } catch (error) {
            console.error(`[App] Error starting ${type} timer:`, error);
        }
    }, [activeTimer, user, activeBaby, userProfile?.familyId]);
    
    const handleStopTimer = useCallback(async () => {
        if (!activeTimer) return;
        try {
            await dataProvider.updateEntry(activeTimer.id, { endedAt: new Date() });
        } catch (error) {
            console.error("[App] Error stopping timer:", error);
        }
    }, [activeTimer]);
    
    const addEntry = useCallback(async (entryData: Omit<AnyEntry, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'schemaVersion'>) => {
        if (!user || !userProfile?.familyId || !activeBaby) return;
        const now = new Date();
        const docPayload = {
            ...entryData,
            babyId: activeBaby.id,
            familyId: userProfile.familyId,
            createdBy: user.uid,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 2,
        };
        try {
            await dataProvider.createEntry(docPayload as Omit<AnyEntry, 'id'>);
            setModalView('none');
            setActiveTab('home');
        } catch (error) {
            console.error("[App] Error adding entry:", error);
        }
    }, [activeBaby, user, userProfile?.familyId]);
    
    const handleUpdateEntry = useCallback(async (updatedEntry: AnyEntry) => {
        try {
            await dataProvider.updateEntry(updatedEntry.id, updatedEntry);
            setModalView('none');
            setSelectedEntry(null);
        } catch (error) {
            console.error(`[App] Error updating entry ${updatedEntry.id}:`, error);
        }
    }, []);

    const handleDeleteEntry = useCallback(async (entryId: string) => {
        const entryToDelete = entries.find(e => e.id === entryId);
        if (!entryToDelete) return;
        try {
            await dataProvider.deleteEntry(entryId);
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
                return <StartFeedScreen onBack={() => setModalView('none')} onStartNursing={handleStartTimer} onLogBottle={(amount, _, type) => {
                    const now = new Date();
                    // FIX: Create a typed variable to prevent excess property errors with discriminated unions.
                    const feedEntry: Omit<Feed, 'id' | 'babyId' | 'familyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'schemaVersion'> = {
                        type: 'feed',
                        kind: 'bottle',
                        amountOz: amount,
                        startedAt: now,
                        endedAt: now
                    };
                    addEntry(feedEntry);
                }}/>;
            case 'logDiaper':
                return <LogDiaperScreen onBack={() => setModalView('none')} onSave={(data) => {
                    const now = new Date();
                    addEntry({ type: 'diaper', ...data, startedAt: now, endedAt: now });
                }} />;
            case 'logBath':
                return <LogBathScreen onBack={() => setModalView('none')} onSave={(data) => {
                     const now = new Date();
                    addEntry({ ...data, startedAt: now, endedAt: now });
                }} entries={entries} />;
            case 'logPump':
                 return <LogPumpScreen onBack={() => setModalView('none')} onSave={(data) => {
                    const newEntry = { type: 'pump', kind: 'pump', ...data };
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
                    onStartPumpClick={() => handleStartTimer('pump')}
                />;
            case 'history':
                return <HistoryScreen entries={entries} onSelectEntry={(entry) => {
                    setSelectedEntry(entry);
                    setModalView('editEntry');
                }} />;
            case 'charts':
                return <StatsScreen baby={activeBaby!} userProfile={userProfile!} />;
            case 'settings':
                return <SettingsScreen 
                    baby={activeBaby!} 
                    onSave={handleSaveBaby}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                />;
            default:
                 return <HomeScreen 
                    baby={activeBaby!} 
                    entries={entries}
                    activeTimer={activeTimer}
                    onStopTimer={handleStopTimer}
                    onStartFeedClick={() => setModalView('logFeed')}
                    onStartSleepClick={() => handleStartTimer('sleep')}
                    onStartDiaperClick={() => setModalView('logDiaper')}
                    onStartBathClick={() => setModalView('logBath')}
                    onStartPumpClick={() => handleStartTimer('pump')}
                />;
        }
    }
    
    if (authLoading || profileLoading) {
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
        <div className="min-h-screen bg-light-bg text-light-text transition-colors duration-300">
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