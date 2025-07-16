export enum Operation {
  GetDocument = 'get_document',
  CreateDocument = 'create_document',
  UpdateDocument = 'update_document',
  DeleteDocument = 'delete_document',
  Query = 'query',
  FtsSearch = 'fts_search',
}

export type SourceOptions = {
  data_api_url: string;
  username: string;
  password: string;
};
export type QueryOptions = {
  operation: string;
  bucket?: string;
  scope?: string;
  collection?: string;
  document_id?: string;
  document?: any;
  query?: any;
  args?: any;
  index_name?: string;
  search_query?: any;
  options?: any;
};
