/**
 * @jest-environment node
 */

import { clearAllViewerCaches, createVersionedStore } from '../versionedIndexedDbStore';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('clearAllViewerCaches', () => {
  afterEach(() => {
    delete global.indexedDB;
  });

  test('deletes viewer caches left by earlier page loads, not only ones registered in this one', async () => {
    createVersionedStore('registered-here');
    global.indexedDB = {
      deleteDatabase: jest.fn(),
      databases: jest
        .fn()
        .mockResolvedValue([
          { name: 'tj-app-cache-app-definitions-v1' },
          { name: 'tj-app-cache-app-definitions-v0' },
          { name: 'unrelated-db' },
        ]),
    };

    clearAllViewerCaches();
    await flushPromises();

    const deleted = indexedDB.deleteDatabase.mock.calls.map(([name]) => name).sort();
    expect(deleted).toEqual([
      'tj-app-cache-app-definitions-v0',
      'tj-app-cache-app-definitions-v1',
      'tj-app-cache-registered-here-v1',
    ]);
  });

  test('never throws, whatever the browser storage does', async () => {
    createVersionedStore('broken');
    global.indexedDB = {
      deleteDatabase: jest.fn(() => {
        throw new Error('simulated storage failure');
      }),
      databases: jest.fn().mockRejectedValue(new Error('simulated storage failure')),
    };

    expect(() => clearAllViewerCaches()).not.toThrow();
    await flushPromises();
  });
});
