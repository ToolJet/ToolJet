export type SourceOptions = {
  apiKey: string;
  url: string;
};

export type QueryOptions = {
  operation: Operation;
  collectionName: string;
  ids?: string;
  points?: string;
  id?: string;
  filter?: string;
  limit?: string;
  withPayload?: string;
  withVectors?: string;
  query?: string;
};

export enum Operation {
  GetCollectionInfo = 'get_collection_info',
  ListCollections = 'list_collections',
  GetPoints = 'get_points',
  UpsertPoints = 'upsert_points',
  DeletePoints = 'delete_points',
  QueryPoints = 'query_points',
}
