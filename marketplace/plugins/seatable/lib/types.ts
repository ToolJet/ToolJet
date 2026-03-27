export type SourceOptions = {
  server_url: string;
  api_token: string;
};

export type QueryOptions = {
  operation:
    | 'list_rows'
    | 'get_row'
    | 'create_row'
    | 'update_row'
    | 'delete_row'
    | 'search_rows'
    | 'get_metadata';
  table_name?: string;
  row_id?: string;
  row_data?: string | Record<string, unknown>;
  page?: string;
  page_size?: string;
  sql_query?: string;
};

export type SeaTableTokenResponse = {
  access_token: string;
  dtable_uuid: string;
  dtable_server: string;
  workspace_id: number;
  dtable_name: string;
  app_name: string;
  use_api_gateway: boolean;
};

export type SeaTableRow = {
  _id: string;
  _mtime?: string;
  _ctime?: string;
  _creator?: string;
  _last_modifier?: string;
  [key: string]: unknown;
};

export type SeaTableTable = {
  _id: string;
  name: string;
  columns: SeaTableColumn[];
  views: SeaTableView[];
};

export type SeaTableColumn = {
  key: string;
  name: string;
  type: string;
  width?: number;
  editable?: boolean;
  data?: Record<string, unknown>;
};

export type SeaTableView = {
  _id: string;
  name: string;
  type: string;
};

export type SeaTableMetadata = {
  tables: SeaTableTable[];
  version: number;
  format_version: number;
};

export type ListRowsResult = {
  rows: SeaTableRow[];
  has_more: boolean;
};

export type SqlResult = {
  metadata: Record<string, unknown>;
  results: SeaTableRow[];
};
