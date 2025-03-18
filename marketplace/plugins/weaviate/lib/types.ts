export interface SourceOptions {
  instanceUrl: string;
  apiKey: string;
  connection_type?: string;
  host?: string;
  port?: string;
}

export interface QueryOptions {
  data_type: string;
  operation_schema: SchemaOperation;
  operation_collection: CollectionOperation;
  operation_objects: ObjectsOperation;
  collectionName?: string;
  consistency?: boolean;
  objectId?: string;
  properties?: string;
  vectorizer?: string;
  vector_index_type?: string;
  vector_index_config?: string;
  sharding_config?: string;
  factor?: string;
  async_enabled?: string;
  clean_up_interval_seconds?: string;
  bm_25?: string;
  deletion_strategy?: string;
  stop_words?: string;
  index_time_stamps?: string;
  index_null_state?: string;
  index_property_length?: string;
  module_config?: string;
  description?: string;
  include_vectors?: string;
  after?: string;
  offset?: string;
  limit?: string;
  include?: string;
  sort?: string;
  tenant?: string;
  collectionName_create_object?: string;
  object_uuid?: string;
  properties_create_object?: string;
  vectors_create_object?: string;
  references?: string;
  collectionName_delete_object?: string;
  objectId_delete_object?: string;
  collectionName_get_object?: string;
  objectId_get_object?: string;
}

export enum SchemaOperation {
  get_schema = 'get_schema',
}
export enum CollectionOperation {
  get_collection = 'get_collection',
  create_collection = 'create_collection',
  delete_collection = 'delete_collection',
}
export enum ObjectsOperation {
  list_objects = 'list_objects',
  create_object = 'create_object',
  get_object_by_id = 'get_object_by_id',
  delete_object_by_id = 'delete_object_by_id',
}
