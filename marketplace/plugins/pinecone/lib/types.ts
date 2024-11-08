export type SourceOptions = {
  apiKey: string;
};

// Define the query options based on the available operations in the operations.json file.
export type QueryOptions = {
  operation: Operation;
  index: string;
  ids?: string[];
  vectors?: string;
  string?: string[];
  id?: string;
  values?: number[];
  sparseValues?: SparseValues;
  setmetadata?: object;
  filter?: string;
  prefix?: string;
  limit?: number;
  paginationToken?: string;
  namespace?: string;
  delete_all?: string;
  metadata?: string;
  sparse_vector?: string;
  top_k?: string;
  include_metadata?: string;
  include_values?: string;
};

// Define a type for sparse vectors used in the "update_vector" operation.
export type SparseValues = {
  indices: number[];
  values: number[];
};

// Enum for different operations.
export enum Operation {
  GetIndexStats = 'get_index_stats',
  ListVectorIds = 'list_vector_ids',
  FetchVectors = 'fetch_vectors',
  UpsertVectors = 'upsert_vectors',
  UpdateVector = 'update_vector',
  DeleteVectors = 'delete_vectors',
  QueryVectors = 'query_vector',
}
