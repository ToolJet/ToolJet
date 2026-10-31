/**
 * @jest-environment node
 */

// A real IndexedDB implementation, so deletes are blocked by open connections the way browsers block them.
import 'fake-indexeddb/auto';
import { clearAllViewerCaches, createVersionedStore } from '../versionedIndexedDbStore';

const entry = (versionId) => ({ appId: 'app-1', versionId, savedAt: Date.now() });

// Resolves 'deleted' once the database is gone, or 'blocked' if an open connection holds it.
const deleteFromAnotherTab = (dbName) =>
  new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => resolve('deleted');
    request.onblocked = () => resolve('blocked');
  });

const databaseExists = async (dbName) => (await indexedDB.databases()).some(({ name }) => name === dbName);

const waitFor = async (condition) => {
  for (let i = 0; i < 50; i++) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
};

describe('viewer cache connections', () => {
  test('lets another tab delete the cache while this tab has it open', async () => {
    const store = createVersionedStore('open-in-this-tab');
    await store.set('ver-1', entry('ver-1'));

    await expect(deleteFromAnotherTab('tj-app-cache-open-in-this-tab-v1')).resolves.toBe('deleted');
  });

  test('keeps working in a tab whose connection was closed for a deletion', async () => {
    const store = createVersionedStore('reopens-after-delete');
    await store.set('ver-1', entry('ver-1'));
    await deleteFromAnotherTab('tj-app-cache-reopens-after-delete-v1');

    await store.set('ver-2', entry('ver-2'));

    await expect(store.get('ver-2')).resolves.toMatchObject({ versionId: 'ver-2' });
  });

  test('logout deletes the cache this tab has open', async () => {
    const store = createVersionedStore('cleared-on-logout');
    await store.set('ver-1', entry('ver-1'));

    clearAllViewerCaches();

    expect(await waitFor(async () => !(await databaseExists('tj-app-cache-cleared-on-logout-v1')))).toBe(true);
  });
});
