import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, Invite } from '../types';
import { 
    getFamilyMembersListener, 
    getActiveInviteListener,
    generateInvite,
    removeFamilyMember
} from '../services/familyService';

interface FamilyScreenProps {
  onBack: () => void;
  // FIX: Pass userProfile as a prop
  userProfile: UserProfile;
}

const MemberItem: React.FC<{member: UserProfile, isCurrentUser: boolean, canRemove: boolean, onRemove: (uid: string) => void}> = 
({member, isCurrentUser, canRemove, onRemove}) => (
    <div className="p-4 flex items-center justify-between">
        <div>
            <p className="font-medium">{member.displayName || member.email} {isCurrentUser && '(You)'}</p>
            <p className="text-sm capitalize text-light-text-secondary dark:text-dark-text-secondary">{member.role}</p>
        </div>
        {canRemove && (
            <button onClick={() => onRemove(member.uid)} className="text-sm text-red-500 hover:text-red-700 font-semibold">
                Remove
            </button>
        )}
    </div>
);

const LabeledDisplay: React.FC<{label: string, value: string, onCopy?: () => void}> = ({label, value, onCopy}) => (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-between">
        <div>
            <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</label>
            <p className="font-medium font-mono break-all">{value}</p>
        </div>
        {onCopy && (
            <button onClick={onCopy} className="ml-2 p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
        )}
    </div>
);

export const FamilyScreen: React.FC<FamilyScreenProps> = ({ onBack, userProfile }) => {
    // FIX: Get user from useAuth, but userProfile from props
    const { user } = useAuth();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [invite, setInvite] = useState<Invite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (!userProfile?.familyId) {
            setIsLoading(false);
            return;
        }
        console.log('[FamilyScreen] Subscribing to family members and invite listeners.');
        setIsLoading(true);

        const unsubscribeMembers = getFamilyMembersListener(userProfile.familyId, (members) => {
            console.log('[FamilyScreen] Received updated members list:', members);
            setMembers(members);
        });
        const unsubscribeInvite = getActiveInviteListener(userProfile.familyId, (activeInvite) => {
            console.log('[FamilyScreen] Received active invite:', activeInvite);
            setInvite(activeInvite);
            setIsLoading(false);
        });

        return () => {
            console.log('[FamilyScreen] Unsubscribing from listeners.');
            unsubscribeMembers();
            unsubscribeInvite();
        };

    }, [userProfile?.familyId]);
    
    const handleRegenerate = async () => {
        if (!user || !userProfile?.familyId) return;
        setIsGenerating(true);
        console.log('[FamilyScreen] User requested to generate new invite code.');
        try {
            await generateInvite(userProfile.familyId, user.uid);
        } catch(error) {
            console.error("[FamilyScreen] Error generating invite:", error);
        } finally {
            setIsGenerating(false);
        }
    }

    const handleRemove = async (memberId: string) => {
        if (!userProfile?.familyId) return;
        if (confirm("Are you sure you want to remove this member? This action cannot be undone.")) {
            console.log(`[FamilyScreen] User requested to remove member: ${memberId}`);
            try {
                await removeFamilyMember(memberId);
            } catch(error) {
                console.error(`[FamilyScreen] Error removing member ${memberId}:`, error);
                alert("Could not remove member. Please try again.");
            }
        }
    }

    const handleCopy = (text: string) => {
        console.log(`[FamilyScreen] Attempting to copy text to clipboard: "${text}"`);
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }).catch(err => {
            console.error('[FamilyScreen] Failed to copy text: ', err);
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    }

    const inviteLink = invite ? `${window.location.origin}/join/${invite.id}` : '';
    const canManage = userProfile?.role === 'owner';

  return (
    <div className="space-y-6">
      <header className="relative flex items-center justify-center">
        <button onClick={onBack} className="absolute left-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Family & Caregivers</h1>
      </header>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Members ({members.length})</h2>
        <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? <p className="p-4 text-center">Loading members...</p> : members.map(m => (
                <MemberItem 
                    key={m.uid}
                    member={m}
                    isCurrentUser={m.uid === user?.uid}
                    canRemove={canManage && m.uid !== user?.uid && m.role !== 'owner'}
                    onRemove={handleRemove}
                />
            ))}
        </div>
      </div>

       {canManage && (
         <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-sm p-4 space-y-4">
              <h2 className="font-semibold text-lg">Invite a caregiver</h2>
              {invite ? (
                 <div className="space-y-3">
                    <LabeledDisplay label="Shareable code" value={invite.id} onCopy={() => handleCopy(invite.id)} />
                    <LabeledDisplay label="Invite link" value={inviteLink} onCopy={() => handleCopy(inviteLink)} />
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center">
                        This code expires on {invite.expiresAt.toLocaleDateString()}.
                    </p>
                </div>
              ) : (
                <p className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary">
                    {isLoading ? "Loading invite..." : "No active invite code. Generate one below."}
                </p>
              )}
              
              <div className="flex space-x-3">
                  <button onClick={handleRegenerate} disabled={isGenerating} className="flex-1 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-300">
                      {isGenerating ? 'Generating...' : (invite ? 'Regenerate Code' : 'Generate Code')}
                  </button>
              </div>
              {copySuccess && <p className="text-center text-sm text-primary">{copySuccess}</p>}
          </div>
       )}
    </div>
  );
};
