import { v4 as uuidv4 } from 'uuid';

/**
 * Upgrades a document from Schema Version 1 to Version 2.
 * 
 * Changes in v2:
 * 1. Adds a `type` field to all entries for discriminated union support.
 * 2. Adds a `sessionId` to nursing feeds to allow for future grouping.
 * 3. Bumps `schemaVersion` to 2.
 * 
 * This function must be idempotent.
 */
export const upgrade = (data: any): any => {
  if (data.schemaVersion >= 2) {
    return data; // Already migrated
  }

  const upgradedData = { ...data };

  // 1. Add `type` field based on existing properties
  if (upgradedData.hasOwnProperty('kind')) {
    upgradedData.type = upgradedData.kind === 'pump' ? 'pump' : 'feed';
  } else if (upgradedData.hasOwnProperty('category')) {
    upgradedData.type = 'sleep';
  } else if (upgradedData.hasOwnProperty('diaperType') || upgradedData.hasOwnProperty('type')) {
    // Old diaper had a 'type' field, new one has 'diaperType'. Handle both.
    if(upgradedData.type && !upgradedData.diaperType) {
        upgradedData.diaperType = upgradedData.type;
    }
    upgradedData.type = 'diaper';
  } else if (upgradedData.hasOwnProperty('bathType')) {
    upgradedData.type = 'bath';
  }
  
  // 2. Backfill sessionId for nursing feeds that don't have one
  if (upgradedData.type === 'feed' && upgradedData.kind === 'nursing' && !upgradedData.sessionId) {
    // For back-fill, each side gets a unique session ID. 
    // New entries created in the app can share an ID across left/right.
    upgradedData.sessionId = uuidv4();
  }

  // 3. Bump schema version
  upgradedData.schemaVersion = 2;

  return upgradedData;
};
