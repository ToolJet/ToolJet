import type { AppItem, FolderItem, ListResponse } from '../../dummyData/types';

const user = { id: 'u1', name: 'User' };

export const makeFolder = (id: string, overrides: Partial<FolderItem> = {}): FolderItem => ({
  kind: 'folder',
  id,
  name: `Folder ${id}`,
  app_count: 2,
  last_modified_at: '2026-01-01T00:00:00Z',
  modified_by: user,
  last_viewed_at: null,
  owner: user,
  pinned: false,
  actions: { rename: true, delete: true, pin: true },
  ...overrides,
});

export const makeApp = (id: string, overrides: Partial<AppItem> = {}): AppItem => ({
  kind: 'app',
  id,
  name: `App ${id}`,
  slug: `app-${id}`,
  icon: 'layout',
  folder: null,
  released_version: null,
  created_at: '2026-01-01T00:00:00Z',
  last_modified_at: '2026-01-01T00:00:00Z',
  modified_by: user,
  last_viewed_at: null,
  owner: user,
  pinned: false,
  git: null,
  actions: { launch: { enabled: true, reason: null }, edit: true, delete: true, pin: true },
  ...overrides,
});

export const makePage = (items: ListResponse['items'], overrides: Partial<ListResponse> = {}): ListResponse => ({
  items,
  page: 1,
  page_size: 50,
  total: items.length,
  counts: { pinned: items.filter((i) => i.pinned).length, folders: 0, apps: 0 },
  folder: null,
  ...overrides,
});
