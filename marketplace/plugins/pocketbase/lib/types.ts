export type SourceOptions = {
  host: string;
  collection_id: string;
  email: string;
  password: string;
};
export type QueryOptions = {
  body: any;
  collectionId: string;
  recordId: string;
  limit: number;
  sort: string;
  operation: string;
  list_filter: object;
};
export type PocketBaseObject = {
  code?: number;
  message?: string;
  data?: object;
  page?: number;
  perPage?: number;
  totalItems?: number;
  totalPages?: number;
  items?: Array<object>;
};
export type PocketBaseOptions = {
  sort?: string;
  filter?: string;
};