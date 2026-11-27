// Response of GET /api/v2/data-sources (data sources dashboard). Field names mirror the API, hence snake_case.

export interface DataSourceRef {
  id: string;
  name: string;
}

interface BaseEntry {
  id: string;
  name: string;
  last_modified_at: string;
  modified_by: DataSourceRef | null;
  last_viewed_at: string | null;
  owner: DataSourceRef | null;
  pinned: boolean;
}

export interface DataSourceEntry extends BaseEntry {
  kind: 'data_source';
  /** Type of the data source: "postgresql", "restapi", "mongodb"... Key into `allSvgs` for built-in ones. */
  data_source_kind: string;
  /** Marketplace plugin id, else null. */
  plugin_id: string | null;
  /** Root and search only: the folder it lives in. */
  folder?: DataSourceRef | null;
  actions: { edit: boolean; delete: boolean; pin: boolean };
  /** False until the data source is pushed to git. Not sent by the API yet, so treat a missing value as unknown. */
  is_synced?: boolean;
}

export interface FolderEntry extends BaseEntry {
  kind: 'folder';
  data_source_count: number;
  actions: { rename: boolean; delete: boolean; pin: boolean };
}

export type DataSourceListItem = DataSourceEntry | FolderEntry;

/** `resource_type` of the data sources dashboard pin endpoints; matches `DataSourceListItem['kind']`. */
export type DataSourcePinKind = DataSourceListItem['kind'];

/** Response of the dashboard bulk calls. Non-empty = nothing was written; resend without these ids to act on the rest. */
export interface DataSourceBulkResponse {
  blocked_ids: string[];
}

/** `folder_only` moves the folders' data sources to root; `folder_and_data_sources` also deletes the ones the user may delete. */
export type DataSourceFolderDeleteMode = 'folder_only' | 'folder_and_data_sources';

export interface DataSourceListResponse {
  items: DataSourceListItem[];
  page: number;
  page_size: number;
  /** Rows across all pages. A folder is one row; its contents are not counted. */
  total: number;
  counts: { pinned: number; folders: number; data_sources: number };
  /** Folder mode: the folder opened; root and search: null. */
  folder: DataSourceRef | null;
}

export interface DataSourcesQueryParams {
  pageNo?: number;
  pageSize?: number;
  /** Lists that folder's data sources. Leave out for the root list. */
  folderId?: string;
  /** Flat list of matching folders and data sources. */
  search?: string;
  /** Part of the query key, so a branch switch refetches. Null = the workspace default branch. */
  branchId: string | null;
}
