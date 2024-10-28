export type SourceOptions = {
  apiKey: string;
};

// Define the query options based on the available operations in the operations.json file.
export type QueryOptions = {
  operation: Operation;
  index: string;
  ids?: string[]; 
  vectors?: Vector[]; 
  string?: string[];
  id?: string; 
  values?: number[]; 
  sparseValues?: SparseValues; 
  setmetadata?: object; 
  filter?: object; 
  prefix?: string; 
  limit?: number; 
  paginationToken?: string; 
  namespace?: string;
  delete_all?: boolean; 
};

// Define a type for the vector structure for upsert and update operations.
export type Vector = {
  id: string;
  values: number[];
  sparse_values: SparseValues;
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
  DeleteVectors = 'delete_vectors'
}
