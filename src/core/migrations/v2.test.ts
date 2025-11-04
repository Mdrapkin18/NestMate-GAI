import { describe, it, expect } from 'vitest';
import { upgrade } from './v2';

describe('Migration: v1 to v2', () => {
  it('should not modify a document that is already v2 or newer', () => {
    const doc = { id: '1', schemaVersion: 2, type: 'sleep' };
    const result = upgrade(doc);
    expect(result).toEqual(doc);
  });

  it('should add type="feed" and a sessionId to a v1 nursing entry', () => {
    const v1_nursing = {
      id: 'n1',
      kind: 'nursing',
      side: 'left',
    };
    const result = upgrade(v1_nursing);
    expect(result.schemaVersion).toBe(2);
    expect(result.type).toBe('feed');
    expect(result.sessionId).toBeDefined();
    expect(typeof result.sessionId).toBe('string');
  });

  it('should add type="pump" to a v1 pump entry', () => {
    const v1_pump = {
      id: 'p1',
      kind: 'pump',
      totalAmountOz: 4,
    };
    const result = upgrade(v1_pump);
    expect(result.schemaVersion).toBe(2);
    expect(result.type).toBe('pump');
  });

  it('should add type="sleep" to a v1 sleep entry', () => {
    const v1_sleep = {
      id: 's1',
      category: 'nap',
    };
    const result = upgrade(v1_sleep);
    expect(result.schemaVersion).toBe(2);
    expect(result.type).toBe('sleep');
  });

  it('should add type="diaper" and handle old "type" field', () => {
    const v1_diaper = {
      id: 'd1',
      type: 'pee', // The old field name
    };
    const result = upgrade(v1_diaper);
    expect(result.schemaVersion).toBe(2);
    expect(result.type).toBe('diaper');
    expect(result.diaperType).toBe('pee');
  });

  it('should be idempotent', () => {
     const v1_nursing = {
      id: 'n1',
      kind: 'nursing',
      side: 'left',
    };
    const firstPass = upgrade(v1_nursing);
    const secondPass = upgrade(firstPass);

    expect(secondPass.schemaVersion).toBe(2);
    expect(secondPass.type).toBe('feed');
    expect(secondPass.sessionId).toBe(firstPass.sessionId); // SessionID should not change
    expect(secondPass).toEqual(firstPass);
  });
});
