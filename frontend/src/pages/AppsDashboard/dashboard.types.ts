export interface FolderItem {
  id: string;
  name: string;
  /** Preformatted, e.g. "9 apps • Edited Sep 12, 2026". */
  description: string;
  isPinned?: boolean;
  /** Not pinned itself, but holds a pinned app, so it is listed under Pinned. */
  hasPinnedApps?: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  /** Preformatted, e.g. "Edited 2 hours ago by user". */
  description: string;
  /** Legacy icon name stored on the app; see `HomePage/AppIcon.jsx`. */
  icon?: string;
  iconColor?: string;
  isPinned?: boolean;
  /** Has changes not yet pushed to git. */
  isUnsynced?: boolean;
}
