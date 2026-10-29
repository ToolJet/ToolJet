import type { ListResponse } from './dummyData/types';

import type { AppItem, FolderItem } from './dummyData/types';

export type TItemKind = 'folder' | 'app';

// `itemKind` decides the shape of `itemDetails`, so the two can't be mismatched.
export type ItemKindWithDetails =
  { itemKind: 'app'; itemDetails: AppItem } | { itemKind: 'folder'; itemDetails: FolderItem };

/** The pagination part of the dashboard items `ListResponse`. */
export type ListMeta = Pick<ListResponse, 'page' | 'page_size' | 'total'>;
