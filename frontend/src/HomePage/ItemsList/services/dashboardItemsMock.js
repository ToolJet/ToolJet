// In-memory stand-in for the dashboard items API until the backend implements the contract.
import configs from '../../Configs/AppIcon.json';
import { APP_ICON_COLORS } from '../../AppIcon';

const MOCK_LATENCY_MS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;
const FOLDER_COUNT = 25;
const STRAY_APP_COUNT = 100;
// How many of the first stray apps are pinned.
const PINNED_STRAY_APP_COUNT = 4;
const LARGE_FOLDER_APP_COUNT = 300;
const MAX_FOLDER_APP_COUNT = 25;
// Fixed counts for the first folders: folder 1 is oversized to exercise the virtualized, infinitely loaded view
// and folder pagination, folders 2-4 are empty, and the rest are small. Later folders get random counts.
const FIXED_FOLDER_APP_COUNTS = [LARGE_FOLDER_APP_COUNT, 0, 0, 0, 12, 8, 6, 10];
// Folder indexes shown under "Pinned".
const PINNED_FOLDER_INDEXES = [4, 5, 6];
// Indexes of apps (within the stray apps, or within a folder by folder index) that are not yet synced to git.
// Index 1 of the stray apps and index 2 of folder 1 are also pinned, to cover both flags on one card.
const UNSYNCED_STRAY_APP_INDEXES = [1, 4, 7, 12];
const UNSYNCED_APP_INDEXES_BY_FOLDER_INDEX = { 0: [2, 5, 20], 4: [0, 3], 7: [1] };
// Folder index -> how many of its first apps are pinned.
const PINNED_APP_COUNT_BY_FOLDER_INDEX = { 0: 3, 7: 2 };

const USERS = [
  'Priya Shah',
  'Jack Eich',
  'Arjun Mehta',
  'Max',
  'Kritarth',
  'Luke',
  'Sara Lin',
  'John Doe',
  'Carlos Rivera',
].map((name, index) => ({ id: `user-${index + 1}`, name }));

const NAME_PREFIXES = ['Client', 'Invoice', 'Fleet', 'Customs', 'Warehouse', 'Shipment', 'Driver', 'Route', 'Vendor'];
const NAME_SUFFIXES = ['onboarding', 'reconciliation', 'tracking', 'portal', 'approval flow', 'audit', 'compliance'];

// Seeded PRNG (mulberry32) so the dataset is identical across reloads.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDataset() {
  const random = createRandom(42);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const now = Date.now();
  const randomPastTimestamp = (maxDaysAgo) => now - random() * maxDaysAgo * DAY_MS;
  let appSequence = 0;

  const createApp = () => {
    appSequence += 1;
    const updatedAt = randomPastTimestamp(60);
    const isReleased = random() < 0.6;
    return {
      kind: 'app',
      id: `app-${appSequence}`,
      name: `${pick(NAME_PREFIXES)} ${pick(NAME_SUFFIXES)} ${appSequence}`,
      updated_at: new Date(updatedAt).toISOString(),
      last_activity_at: new Date(updatedAt + random() * (now - updatedAt)).toISOString(),
      modified_by: pick(USERS),
      owner: pick(USERS),
      released_version: isReleased
        ? { id: `version-${appSequence}`, name: `Version ${1 + Math.floor(random() * 3)}.${Math.floor(random() * 5)}` }
        : null,
      is_public: random() < 0.3,
      icon: pick(configs.iconList),
      // Figma assigns colors in rotation.
      icon_color: APP_ICON_COLORS[appSequence % APP_ICON_COLORS.length],
      is_pinned: false,
      is_app_synced: true,
    };
  };

  const appsByFolderId = {};
  const usedFolderNames = new Set();
  // Folder names are unique per workspace; the folder view resolves a folder from its name.
  const pickUniqueFolderName = () => {
    const name = `${pick(NAME_PREFIXES)} ${pick(NAME_SUFFIXES)}`;
    let uniqueName = name;
    for (let copy = 2; usedFolderNames.has(uniqueName); copy += 1) uniqueName = `${name} ${copy}`;
    usedFolderNames.add(uniqueName);
    return uniqueName;
  };
  const folders = Array.from({ length: FOLDER_COUNT }, (_, index) => {
    const id = `folder-${index + 1}`;
    const randomAppCount = Math.floor(random() * (MAX_FOLDER_APP_COUNT + 1));
    const appCount = FIXED_FOLDER_APP_COUNTS[index] ?? randomAppCount;
    const apps = Array.from({ length: appCount }, createApp);
    apps.slice(0, PINNED_APP_COUNT_BY_FOLDER_INDEX[index] ?? 0).forEach((app) => {
      app.is_pinned = true;
    });
    (UNSYNCED_APP_INDEXES_BY_FOLDER_INDEX[index] ?? []).forEach((appIndex) => {
      if (apps[appIndex]) apps[appIndex].is_app_synced = false;
    });
    appsByFolderId[id] = apps;
    const updatedAt = randomPastTimestamp(30);
    const lastActivityAt = apps.reduce(
      (latest, app) => (app.last_activity_at > latest ? app.last_activity_at : latest),
      new Date(updatedAt).toISOString()
    );
    return {
      kind: 'folder',
      id,
      name: pickUniqueFolderName(),
      updated_at: new Date(updatedAt).toISOString(),
      last_activity_at: lastActivityAt,
      modified_by: pick(USERS),
      owner: pick(USERS),
      released_version: null,
      app_count: appCount,
      is_pinned: PINNED_FOLDER_INDEXES.includes(index),
      has_pinned_apps: apps.some((app) => app.is_pinned),
    };
  });

  const strayApps = Array.from({ length: STRAY_APP_COUNT }, createApp);
  strayApps.slice(0, PINNED_STRAY_APP_COUNT).forEach((app) => {
    app.is_pinned = true;
  });
  UNSYNCED_STRAY_APP_INDEXES.forEach((appIndex) => {
    strayApps[appIndex].is_app_synced = false;
  });
  return { folders, strayApps, appsByFolderId };
}

let dataset = null;
// Built lazily so the mock costs nothing unless the new dashboard renders.
function getDataset() {
  if (!dataset) dataset = buildDataset();
  return dataset;
}

// ISO-8601 timestamps sort correctly as plain strings.
const SORT_COMPARATORS = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
  modified_desc: (a, b) => b.updated_at.localeCompare(a.updated_at),
  modified_asc: (a, b) => a.updated_at.localeCompare(b.updated_at),
  activity_desc: (a, b) => b.last_activity_at.localeCompare(a.last_activity_at),
  activity_asc: (a, b) => a.last_activity_at.localeCompare(b.last_activity_at),
};

// Folders holding a pinned app belong to the pinned group too, as in the grid's Pinned section.
const isInPinnedGroup = (item) => Boolean(item.is_pinned || item.has_pinned_apps);

// The pinned group always comes first, then the requested sort.
const compareBySort = (sort) => (a, b) =>
  Number(isInPinnedGroup(b)) - Number(isInPinnedGroup(a)) || SORT_COMPARATORS[sort](a, b);

const matchesSearch = (item, searchKey) => !searchKey || item.name.toLowerCase().includes(searchKey.toLowerCase());

function matchesAppFilters(app, { releaseStatus, visibility }) {
  if (releaseStatus.length && !releaseStatus.includes(app.released_version ? 'released' : 'unreleased')) return false;
  if (visibility.length && !visibility.includes(app.is_public ? 'public' : 'private')) return false;
  return true;
}

// With filters active a folder is shown only if at least one of its apps matches them.
function isFolderVisible(folder, apps, params) {
  const hasFilters = params.releaseStatus.length > 0 || params.visibility.length > 0;
  const matchingApps = apps.filter((app) => matchesAppFilters(app, params));
  if (hasFilters && !matchingApps.length) return false;
  return matchesSearch(folder, params.searchKey) || matchingApps.some((app) => matchesSearch(app, params.searchKey));
}

function respondAfterLatency(payload, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(payload), MOCK_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    });
  });
}

function getRootItems(params, { signal } = {}) {
  const { folders, strayApps, appsByFolderId } = getDataset();
  const { page, perPage, sort } = params;

  const visibleItems = [
    ...folders.filter((folder) => isFolderVisible(folder, appsByFolderId[folder.id], params)),
    ...strayApps.filter((app) => matchesAppFilters(app, params) && matchesSearch(app, params.searchKey)),
  ].sort(compareBySort(sort));

  const start = (page - 1) * perPage;
  return respondAfterLatency(
    {
      meta: {
        total_count: visibleItems.length,
        total_pages: Math.max(1, Math.ceil(visibleItems.length / perPage)),
        current_page: page,
        per_page: perPage,
      },
      items: visibleItems.slice(start, start + perPage),
    },
    signal
  );
}

// A folder that matched the search by its own name lists all its apps; otherwise only the matching ones.
function getFolderItems(folderId, params, { signal } = {}) {
  const { folders, appsByFolderId } = getDataset();
  const { page, perPage, sort, searchKey } = params;
  const folder = folders.find(({ id }) => id === folderId);
  const searchApps = !matchesSearch(folder, searchKey);

  const visibleApps = appsByFolderId[folderId]
    .filter((app) => matchesAppFilters(app, params) && (!searchApps || matchesSearch(app, searchKey)))
    .sort(compareBySort(sort));

  const start = (page - 1) * perPage;
  return respondAfterLatency(
    {
      meta: {
        total_count: visibleApps.length,
        total_pages: Math.max(1, Math.ceil(visibleApps.length / perPage)),
        current_page: page,
        per_page: perPage,
        has_more: start + perPage < visibleApps.length,
      },
      items: visibleApps.slice(start, start + perPage),
    },
    signal
  );
}

export const mockDashboardItemsApi = { getRootItems, getFolderItems };
