import { SCHEMA_VERSION } from '../domain/types';
import { upgrade as upgradeToV2 } from './v2';

// The list of migration functions, in order.
// The key is the version the function upgrades TO.
const MIGRATIONS: Record<number, (data: any) => any> = {
  2: upgradeToV2,
  // Future migrations will be added here:
  // 3: upgradeToV3,
};

/**
 * Runs all necessary migration functions on a document to bring it
 * up to the latest schema version.
 * @param doc The raw document data from Firestore.
 * @returns The migrated document data.
 */
export const runMigrations = (doc: any): any => {
  let currentVersion = doc.schemaVersion || 1; // Assume version 1 if not present
  let migratedDoc = { ...doc };

  while (currentVersion < SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1;
    const upgradeFn = MIGRATIONS[nextVersion];

    if (upgradeFn) {
      migratedDoc = upgradeFn(migratedDoc);
      console.log(`[Migration] Upgraded doc ${doc.id} from v${currentVersion} to v${nextVersion}`);
    } else {
      // This should not happen if migrations are written correctly.
      console.warn(`[Migration] No migration function found for v${nextVersion}. Stopping.`);
      break;
    }
    
    currentVersion = migratedDoc.schemaVersion;
  }

  return migratedDoc;
};
