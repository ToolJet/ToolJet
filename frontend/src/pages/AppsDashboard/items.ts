import moment from 'moment';

import type { AppItem, FolderItem, ListItem } from './dummyData/types';
import { appTypeToDisplayNameMapping, type TAppType } from './helper';

export const isFolderItem = (item: ListItem): item is FolderItem => item.kind === 'folder';

export const isAppItem = (item: ListItem): item is AppItem => item.kind === 'app';

// Listed under Pinned: pinned itself, or a folder holding a pinned app.
export const isInPinnedSection = (item: ListItem): boolean =>
  item.pinned || (item.kind === 'folder' && Boolean(item.has_pinned_apps));

// e.g. "9 apps • Edited Sep 12, 2026" for a folder, "Edited 2 hours ago by Priya Nair" for an app.
// The folder's noun follows the app type: app(s), module(s) or workflow(s).
export const getItemDescription = (item: ListItem, appType: TAppType): string => {
  if (item.kind === 'folder') {
    const noun = appTypeToDisplayNameMapping[appType];
    return `${item.app_count} ${item.app_count === 1 ? noun : `${noun}s`} • Edited ${moment(item.last_modified_at).format('MMM DD, YYYY')}`;
  }
  return `Edited ${moment(item.last_modified_at).fromNow()}${item.modified_by ? ` by ${item.modified_by.name}` : ''}`;
};
