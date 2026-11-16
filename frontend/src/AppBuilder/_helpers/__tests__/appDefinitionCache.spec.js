/**
 * @jest-environment node
 */

// In-memory stand-in for IndexedDB, so the spec can see exactly which entries the cache keeps.
const mockEntries = new Map();
jest.mock('idb-keyval', () => ({
  createStore: () => 'store',
  get: async (key) => mockEntries.get(key),
  set: async (key, value) => void mockEntries.set(key, value),
  del: async (key) => void mockEntries.delete(key),
  keys: async () => [...mockEntries.keys()],
}));

import { getCachedAppDefinition, setCachedAppDefinition } from '../appDefinitionCache';

describe('appDefinitionCache', () => {
  beforeEach(() => mockEntries.clear());

  test('serves a cached definition only for the revision it was saved under', async () => {
    await setCachedAppDefinition('app-1', 'ver-1', 'rev-a', { pages: ['home'] });

    expect(await getCachedAppDefinition('ver-1', 'rev-a')).toEqual({ pages: ['home'] });
    expect(await getCachedAppDefinition('ver-1', 'rev-b')).toBeUndefined();
  });

  test('keeps one entry per version, replacing it when the revision changes', async () => {
    await setCachedAppDefinition('app-1', 'ver-1', 'rev-a', { pages: ['home', 'admin'] });
    await setCachedAppDefinition('app-1', 'ver-1', 'rev-b', { pages: ['home'] });

    expect(mockEntries.size).toBe(1);
    expect(await getCachedAppDefinition('ver-1', 'rev-a')).toBeUndefined();
    expect(await getCachedAppDefinition('ver-1', 'rev-b')).toEqual({ pages: ['home'] });
  });

  test('never caches without a revision', async () => {
    await setCachedAppDefinition('app-1', 'ver-1', null, { pages: ['home'] });

    expect(mockEntries.size).toBe(0);
    expect(await getCachedAppDefinition('ver-1', null)).toBeUndefined();
  });
});
