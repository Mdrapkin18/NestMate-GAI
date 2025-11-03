import { 
    doc, 
    setDoc, 
    getDoc,
    updateDoc, 
    collection, 
    query, 
    where, 
    onSnapshot,
    Timestamp,
    orderBy,
    limit,
    serverTimestamp,
    deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { generateInviteCode } from '../utils/helpers';
import { UserProfile, Invite, inviteSchema } from '../types';

/**
 * Creates a new family for a user, making them the owner.
 * @param userId The UID of the user creating the family.
 */
export const createFamily = async (userId: string): Promise<string> => {
    const familyId = uuidv4();
    const userRef = doc(db, 'users', userId);
    console.log(`[familyService] Creating family ${familyId} for user ${userId}`);
    await updateDoc(userRef, {
        familyId: familyId,
        role: 'owner'
    });
    console.log(`[familyService] Successfully created family.`);
    return familyId;
};

/**
 * Generates a new invite code for a family.
 * Codes are valid for 7 days.
 * @param familyId The ID of the family to generate an invite for.
 * @param createdBy The UID of the user generating the invite.
 * @returns The generated invite code.
 */
export const generateInvite = async (familyId: string, createdBy: string): Promise<string> => {
    const code = generateInviteCode();
    const inviteRef = doc(db, 'invites', code);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const newInvite: Omit<Invite, 'id'> = {
        familyId,
        createdBy,
        createdAt: now,
        expiresAt,
    };
    
    console.log(`[familyService] Generating invite code "${code}" for family ${familyId}`);
    await setDoc(inviteRef, newInvite);
    return code;
};

/**
 * Allows a user to join a family using an invite code.
 * @param inviteCode The invite code.
 * @param userId The UID of the user joining.
 * @returns An object indicating success or failure with an error message.
 */
export const acceptInvite = async (inviteCode: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    const code = inviteCode.toUpperCase().trim();
    console.log(`[familyService] User ${userId} attempting to accept invite code "${code}"`);
    const inviteRef = doc(db, 'invites', code);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
        console.warn(`[familyService] Invite code "${code}" not found.`);
        return { success: false, error: "Invalid invite code." };
    }

    const inviteData = inviteSnap.data() as Omit<Invite, 'id'>;
    
    // Convert Firestore Timestamp to Date if necessary
    const expiresAtDate = (inviteData.expiresAt as unknown as Timestamp).toDate ? (inviteData.expiresAt as unknown as Timestamp).toDate() : inviteData.expiresAt;

    if (expiresAtDate < new Date()) {
        console.warn(`[familyService] Invite code "${code}" has expired.`);
        return { success: false, error: "This invite code has expired." };
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        familyId: inviteData.familyId,
        role: 'caregiver'
    });
    console.log(`[familyService] User ${userId} successfully joined family ${inviteData.familyId}.`);

    return { success: true };
};

/**
 * Sets up a real-time listener for all members of a family.
 * @param familyId The ID of the family.
 * @param callback The function to call with the updated list of members.
 * @returns An unsubscribe function to stop the listener.
 */
export const getFamilyMembersListener = (familyId: string, callback: (members: UserProfile[]) => void): (() => void) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("familyId", "==", familyId));

    return onSnapshot(q, (querySnapshot) => {
        const members: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            members.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        callback(members);
    });
};

/**
 * Sets up a listener for the currently active (non-expired) invite for a family.
 * @param familyId The ID of the family.
 * @param callback The function to call with the active invite or null.
 * @returns An unsubscribe function to stop the listener.
 */
export const getActiveInviteListener = (familyId: string, callback: (invite: Invite | null) => void): (() => void) => {
    const invitesRef = collection(db, 'invites');
    const q = query(
        invitesRef, 
        where("familyId", "==", familyId),
        where("expiresAt", ">", new Date()),
        orderBy("expiresAt", "desc"),
        limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            callback(null);
        } else {
            const doc = querySnapshot.docs[0];
            const parsedInvite = inviteSchema.safeParse({ id: doc.id, ...doc.data() });
            if (parsedInvite.success) {
                callback(parsedInvite.data);
            } else {
                console.error("[familyService] Failed to parse invite:", parsedInvite.error);
                callback(null);
            }
        }
    });
};

/**
 * Removes a member from a family by deleting their familyId and role fields.
 * @param userId The UID of the user to remove.
 */
export const removeFamilyMember = async (userId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    console.log(`[familyService] Removing user ${userId} from their family.`);
    // FIX: Use deleteField() to properly remove fields instead of setting them to null.
    await updateDoc(userRef, {
        familyId: deleteField(),
        role: deleteField()
    });
    console.log(`[familyService] Successfully removed user ${userId}.`);
};