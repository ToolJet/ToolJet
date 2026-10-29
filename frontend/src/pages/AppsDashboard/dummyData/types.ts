/** ISO 8601 timestamp, e.g. "2026-08-15T10:04:00Z" */
type ISODateString = string;

export interface UserRef {
  id: string;
  name: string;
}

interface FolderRef {
  id: string;
  name: string;
}

/* ---------- Folder item ---------- */

interface FolderActions {
  rename: boolean;
  delete: boolean;
  pin: boolean;
}

export interface FolderItem {
  kind: 'folder';
  id: string;
  name: string;
  app_count: number;
  last_modified_at: ISODateString;
  modified_by: UserRef | null;
  last_viewed_at: ISODateString | null;
  owner: UserRef | null;
  pinned: boolean;
  /** Not in the contract yet: at least one app inside is pinned, which lists the folder under Pinned. */
  has_pinned_apps?: boolean;
  actions: FolderActions;
}

/* ---------- App item ---------- */

type LaunchDisabledReason = 'not_released' | 'maintenance' | 'no_released_access';

export type AppLaunchAction = { enabled: true; reason: null } | { enabled: false; reason: LaunchDisabledReason } | null;

interface AppActions {
  launch: AppLaunchAction;
  edit: boolean;
  delete: boolean;
  pin: boolean;
}

export interface GitInfo {
  synced: boolean;
  version_synced: boolean;
  stub: boolean;
  push_version_id: string | null;
}

export interface AppItem {
  kind: 'app';
  id: string;
  name: string;
  slug: string;
  icon: string;
  /** null = stray app (not in any folder) */
  folder: FolderRef | null;
  released_version: string | null;
  last_modified_at: ISODateString;
  modified_by: UserRef | null;
  last_viewed_at: ISODateString | null;
  owner: UserRef;
  pinned: boolean;
  actions: AppActions;
  git: GitInfo | null;
}

/* ---------- Discriminated union ---------- */

export type ListItem = FolderItem | AppItem;

/* ---------- Response ---------- */

export interface ListCounts {
  /** pinned rows */
  pinned: number;
  /** unpinned folders (0 in folder mode) */
  folders: number;
  /** unpinned apps: root = apps not in a folder; folder = apps in it; search = matches */
  apps: number;
}

export interface ListResponse {
  /** This page's rows, pinned first */
  items: ListItem[];
  page: number;
  page_size: number;
  /** pinned + folders + apps; covers ALL pages, same on every page */
  total: number;
  counts: ListCounts;
  /** Folder mode only, otherwise null */
  folder: FolderRef | null;
}
