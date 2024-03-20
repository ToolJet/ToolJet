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
  filterField: string;
  filterOperation: string;
  filterValue: string;
  operation: string;
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