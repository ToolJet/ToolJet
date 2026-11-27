import moment from 'moment';

import type {
  DataSourceEntry,
  DataSourceListItem,
  DataSourceRef,
  FolderEntry,
} from '@/_services/types/globalDatasource.types';

// Mirrors the GET /api/v2/data-sources rows, for stories and tests that need list data without the API.
const U: Record<string, DataSourceRef> = {
  priya: { id: 'u-1', name: 'Priya Shah' },
  jack: { id: 'u-2', name: 'Jack Eich' },
  arjun: { id: 'u-3', name: 'Arjun Mehta' },
  max: { id: 'u-4', name: 'Max' },
  kritarth: { id: 'u-5', name: 'Kritarth' },
  luke: { id: 'u-6', name: 'Luke' },
  sara: { id: 'u-7', name: 'Sara Lin' },
  john: { id: 'u-8', name: 'John Doe' },
  carlos: { id: 'u-9', name: 'Carlos Rivera' },
};

// Relative to load time so the "x ago" labels stay realistic.
const hoursAgo = (hours: number) => moment().subtract(hours, 'hours').toISOString();
const daysAgo = (days: number) => moment().subtract(days, 'days').toISOString();

const folder = (
  id: string,
  name: string,
  dataSourceCount: number,
  lastModifiedAt: string,
  modifiedBy: DataSourceRef,
  owner: DataSourceRef
): FolderEntry => ({
  kind: 'folder',
  id,
  name,
  data_source_count: dataSourceCount,
  last_modified_at: lastModifiedAt,
  modified_by: modifiedBy,
  last_viewed_at: null,
  owner,
  pinned: false,
  actions: { rename: true, delete: true, pin: true },
});

const dataSource = (
  id: string,
  name: string,
  dataSourceKind: string,
  lastModifiedAt: string,
  modifiedBy: DataSourceRef,
  owner: DataSourceRef
): DataSourceEntry => ({
  kind: 'data_source',
  id,
  name,
  data_source_kind: dataSourceKind,
  plugin_id: null,
  last_modified_at: lastModifiedAt,
  modified_by: modifiedBy,
  last_viewed_at: null,
  owner,
  pinned: false,
  actions: { edit: true, delete: true, pin: true },
});

export const DUMMY_DATA_SOURCES: DataSourceListItem[] = [
  folder('f-1', 'Production databases', 0, daysAgo(3), U.priya, U.jack),
  folder('f-2', 'Payments & billing', 0, daysAgo(1), U.priya, U.jack),
  folder('f-3', 'Analytics warehouse', 0, daysAgo(14), U.arjun, U.max),
  dataSource('d-1', 'Orders DB', 'postgresql', hoursAgo(1), U.kritarth, U.max),
  folder('f-4', 'Core databases', 3, daysAgo(3), U.luke, U.sara),
  folder('f-5', 'Marketing tools', 0, daysAgo(3), U.john, U.carlos),
  folder('f-6', 'Cloud & storage', 2, daysAgo(3), U.sara, U.max),
  folder('f-7', 'Messaging services', 0, daysAgo(5), U.john, U.kritarth),
  folder('f-8', 'Search & monitoring', 0, hoursAgo(2), U.carlos, U.john),
  dataSource('d-7', 'Stripe payments', 'stripe', daysAgo(3), U.arjun, U.john),
];

// Folder-mode responses, keyed by folder id.
export const DUMMY_FOLDER_CONTENTS: Record<string, DataSourceEntry[]> = {
  'f-4': [
    dataSource('d-2', 'Users DB', 'mysql', daysAgo(76), U.jack, U.sara),
    dataSource('d-3', 'Sessions cache', 'redis', daysAgo(63), U.luke, U.sara),
    dataSource('d-4', 'Event logs', 'mongodb', hoursAgo(1), U.john, U.max),
  ],
  'f-6': [
    dataSource('d-5', 'Asset bucket', 's3', daysAgo(3), U.carlos, U.jack),
    dataSource('d-6', 'Product catalog', 'airtable', daysAgo(1), U.john, U.kritarth),
  ],
};
