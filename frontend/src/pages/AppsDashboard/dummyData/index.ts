import type {
  AppItem,
  AppLaunchAction,
  FolderItem,
  GitInfo,
  ListCounts,
  ListItem,
  ListResponse,
  UserRef,
} from './types';

// Fixed "now" keeps the data deterministic across reloads
const NOW = Date.parse('2026-10-27T09:00:00Z');
const hoursAgo = (hours: number): string => new Date(NOW - hours * 3_600_000).toISOString();

const USERS: UserRef[] = [
  { id: 'u-01', name: 'Aarav Mehta' },
  { id: 'u-02', name: 'Sofia Alvarez' },
  { id: 'u-03', name: 'Liam Chen' },
  { id: 'u-04', name: 'Priya Nair' },
  { id: 'u-05', name: 'Noah Williams' },
  { id: 'u-06', name: 'Emma Johansson' },
  { id: 'u-07', name: 'Kenji Tanaka' },
  { id: 'u-08', name: 'Fatima Al-Sayed' },
];

const ICONS = [
  'apps',
  'archive',
  'floppydisk',
  'layers',
  'folderupload',
  'grid',
  'home',
  'sentfast',
  'server',
  'globe',
  'share',
  'shield',
  'sun',
  'table',
  'menuhome',
  'draghandle',
];

const APP_NAMES = [
  'Order Tracker',
  'Inventory Manager',
  'Support Desk',
  'Expense Approvals',
  'Customer 360',
  'Lead Scorer',
  'Invoice Generator',
  'Shift Planner',
  'Incident Console',
  'Release Dashboard',
  'Vendor Portal',
  'Leave Requests',
  'Asset Register',
  'Refund Handler',
  'Sales Pipeline',
  'Audit Log Viewer',
  'Onboarding Checklist',
  'Fleet Monitor',
  'Feedback Inbox',
  'Pricing Calculator',
];

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

interface FolderSpec {
  name: string;
  appCount: number;
  pinned?: boolean;
}

// Mix of large (20-40 apps), small, empty and pinned folders
const FOLDER_SPECS: FolderSpec[] = [
  { name: 'Customer Support', appCount: 34, pinned: true },
  { name: 'Sales Operations', appCount: 28 },
  { name: 'Finance & Billing', appCount: 40 },
  { name: 'HR & People', appCount: 0, pinned: true },
  { name: 'Internal Tools', appCount: 22 },
  { name: 'Marketing', appCount: 25 },
  { name: 'Engineering', appCount: 31 },
  { name: 'Data & Analytics', appCount: 36 },
  { name: 'Product', appCount: 20 },
  { name: 'Legal & Compliance', appCount: 0 },
  { name: 'Archive', appCount: 0 },
  { name: 'Onboarding', appCount: 3 },
  { name: 'Inventory', appCount: 1 },
  { name: 'Logistics', appCount: 5 },
  { name: 'IT Helpdesk', appCount: 24 },
  { name: 'Procurement', appCount: 0 },
  { name: 'Partners', appCount: 4 },
  { name: 'Sandbox', appCount: 2 },
  { name: 'Q4 Planning', appCount: 0 },
  { name: 'Vendor Management', appCount: 27 },
  { name: 'Facilities', appCount: 6 },
  { name: 'Security', appCount: 21 },
  { name: 'Training', appCount: 0 },
  { name: 'Research', appCount: 8 },
  { name: 'Demos', appCount: 12 },
  { name: 'Customer Success', appCount: 29 },
  { name: 'Compliance Audits', appCount: 23 },
  { name: 'Field Operations', appCount: 2 },
  { name: 'Experiments', appCount: 0 },
  { name: 'Admin Utilities', appCount: 7 },
  // Oversized folder to exercise the virtualized, infinitely loaded folder rows
  { name: 'Large Archive', appCount: 150 },
];

const STRAY_APP_COUNT = 80;

// Every third folder with 10+ apps holds pinned apps (every 10th app); the rest hold none
const PINNED_APP_INTERVAL = 10;
const folderHasPinnedApps = (appCount: number, folderIndex: number): boolean =>
  appCount >= PINNED_APP_INTERVAL && folderIndex % 3 === 0;

const buildFolder = (spec: FolderSpec, index: number): FolderItem => ({
  kind: 'folder',
  id: `folder-${String(index + 1).padStart(3, '0')}`,
  name: spec.name,
  app_count: spec.appCount,
  last_modified_at: hoursAgo(index * 7 + 2),
  modified_by: index % 9 === 0 ? null : USERS[(index * 3) % USERS.length],
  last_viewed_at: index % 5 === 0 ? null : hoursAgo(index * 5 + 1),
  owner: index % 6 === 0 ? null : USERS[index % USERS.length],
  pinned: Boolean(spec.pinned),
  has_pinned_apps: folderHasPinnedApps(spec.appCount, index),
  actions: {
    rename: index % 8 !== 3,
    delete: index % 8 !== 0,
    pin: true,
  },
});

// Covers every launch state: not released, maintenance, no access to released version, enabled, and none (null)
const buildLaunchAction = (releasedVersion: string | null, seed: number): AppLaunchAction => {
  if (seed % 29 === 0) return null;
  if (releasedVersion === null) return { enabled: false, reason: 'not_released' };
  if (seed % 13 === 0) return { enabled: false, reason: 'maintenance' };
  if (seed % 17 === 0) return { enabled: false, reason: 'no_released_access' };
  return { enabled: true, reason: null };
};

// Covers git not set up (null), fully synced, unsynced, version out of sync and stub apps
const buildGitInfo = (seed: number): GitInfo | null => {
  const pushVersionId = `version-${seed + 1}`;
  switch (seed % 7) {
    case 1:
    case 3:
      return { synced: true, version_synced: true, stub: false, push_version_id: null };
    case 2:
      return { synced: false, version_synced: false, stub: false, push_version_id: pushVersionId };
    case 4:
      return { synced: true, version_synced: false, stub: false, push_version_id: pushVersionId };
    case 6:
      return { synced: true, version_synced: true, stub: true, push_version_id: null };
    default:
      return null;
  }
};

const buildApp = (seed: number, folder: FolderItem | null, pinned: boolean): AppItem => {
  const baseName = APP_NAMES[seed % APP_NAMES.length];
  const name = `${baseName} ${Math.floor(seed / APP_NAMES.length) + 1}`;
  const releasedVersion = seed % 5 === 0 ? null : `v${1 + (seed % 4)}.${seed % 10}.0`;

  return {
    kind: 'app',
    id: `app-${String(seed + 1).padStart(4, '0')}`,
    name,
    slug: toSlug(name),
    icon: ICONS[seed % ICONS.length],
    folder: folder ? { id: folder.id, name: folder.name } : null,
    released_version: releasedVersion,
    last_modified_at: hoursAgo(seed * 3 + 1),
    modified_by: seed % 11 === 0 ? null : USERS[(seed * 3) % USERS.length],
    last_viewed_at: seed % 7 === 0 ? null : hoursAgo(seed * 2 + 1),
    owner: USERS[seed % USERS.length],
    pinned,
    git: buildGitInfo(seed),
    actions: {
      launch: buildLaunchAction(releasedVersion, seed),
      edit: seed % 19 !== 0,
      delete: seed % 23 !== 0,
      pin: true,
    },
  };
};

export const dummyFolders: FolderItem[] = FOLDER_SPECS.map(buildFolder);

let appSeed = 0;

// Stray apps live at the root, outside any folder
export const dummyStrayApps: AppItem[] = Array.from({ length: STRAY_APP_COUNT }, (_, i) =>
  buildApp(appSeed++, null, i % 30 === 0)
);

export const dummyFolderApps: AppItem[] = dummyFolders.flatMap((folder, folderIndex) =>
  Array.from({ length: folder.app_count }, (_, j) =>
    buildApp(appSeed++, folder, folderHasPinnedApps(folder.app_count, folderIndex) && j % PINNED_APP_INTERVAL === 0)
  )
);

export const dummyApps: AppItem[] = [...dummyFolderApps, ...dummyStrayApps];

export const dummyItems: ListItem[] = [...dummyFolders, ...dummyApps];

/* ---------- Pagination ---------- */

export const ROOT_PAGE_SIZE = 50;
export const FOLDER_PAGE_SIZE = 20;

export interface ListQuery {
  page?: number;
  /** Omit for the root listing (folders + stray apps) */
  folderId?: string;
  searchKey?: string;
  /** Defaults to ROOT_PAGE_SIZE at root and FOLDER_PAGE_SIZE inside a folder */
  perPage?: number;
}

const matchesSearch = ({ name }: { name: string }, searchKey = ''): boolean =>
  !searchKey || name.toLowerCase().includes(searchKey.toLowerCase());

// A folder holding a pinned app is listed under Pinned even when it is not pinned itself
const isInPinnedGroup = (item: ListItem): boolean =>
  item.pinned || (item.kind === 'folder' && Boolean(item.has_pinned_apps));

const getFolderApps = (folderId: string): AppItem[] => dummyFolderApps.filter((app) => app.folder?.id === folderId);

interface Rows {
  /** Pinned folders, then folders holding pinned apps, then pinned stray apps (apps only in folder mode) */
  pinned: ListItem[];
  folders: FolderItem[];
  apps: AppItem[];
}

const getFolderRows = (folder: FolderItem, searchKey?: string): Rows => {
  // A folder matching the search by its own name lists all its apps; otherwise only the matching ones
  const apps = getFolderApps(folder.id).filter(
    (app) => matchesSearch(folder, searchKey) || matchesSearch(app, searchKey)
  );
  return { pinned: apps.filter((app) => app.pinned), folders: [], apps: apps.filter((app) => !app.pinned) };
};

const getRootRows = (searchKey?: string): Rows => {
  // A folder stays visible when its own name or any of its apps match the search
  const folders = dummyFolders.filter(
    (folder) =>
      matchesSearch(folder, searchKey) || getFolderApps(folder.id).some((app) => matchesSearch(app, searchKey))
  );
  const strayApps = dummyStrayApps.filter((app) => matchesSearch(app, searchKey));

  return {
    pinned: [
      ...folders.filter((folder) => folder.pinned),
      ...folders.filter((folder) => !folder.pinned && folder.has_pinned_apps),
      ...strayApps.filter((app) => app.pinned),
    ],
    folders: folders.filter((folder) => !isInPinnedGroup(folder)),
    apps: strayApps.filter((app) => !app.pinned),
  };
};

// Sort and filters are not supported yet, so rows keep the contract order: pinned group, folders, apps
export const getDummyListResponse = ({ page = 1, folderId, searchKey, perPage }: ListQuery = {}): ListResponse => {
  const folder = folderId ? dummyFolders.find((f) => f.id === folderId) : undefined;
  const rows: Rows = folderId
    ? folder
      ? getFolderRows(folder, searchKey)
      : { pinned: [], folders: [], apps: [] }
    : getRootRows(searchKey);
  const allRows: ListItem[] = [...rows.pinned, ...rows.folders, ...rows.apps];
  const pageSize = perPage ?? (folderId ? FOLDER_PAGE_SIZE : ROOT_PAGE_SIZE);
  const start = (Math.max(page, 1) - 1) * pageSize;

  const counts: ListCounts = {
    pinned: rows.pinned.length,
    folders: rows.folders.length,
    apps: rows.apps.length,
  };

  return {
    items: allRows.slice(start, start + pageSize),
    page,
    page_size: pageSize,
    total: allRows.length,
    counts,
    folder: folder ? { id: folder.id, name: folder.name } : null,
  };
};

/* ---------- Sections ---------- */

export interface ListSections {
  /** Pinned folders and apps, plus folders holding a pinned app */
  pinned: ListItem[];
  /** Other folders */
  folders: FolderItem[];
  /** Other apps (stray apps at root, the folder's apps in folder mode) */
  apps: AppItem[];
}

// Splits only the rows of the page passed in, not the full list
export const splitIntoSections = (items: ListItem[]): ListSections => {
  const sections: ListSections = { pinned: [], folders: [], apps: [] };

  items.forEach((item) => {
    if (isInPinnedGroup(item)) sections.pinned.push(item);
    else if (item.kind === 'folder') sections.folders.push(item);
    else sections.apps.push(item);
  });

  return sections;
};
