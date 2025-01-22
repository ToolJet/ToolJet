export interface SourceOptions {
  instanceUrl: string;
  apiKey: string;
}

export interface QueryOptions {
  operation: Operation;
  collectionName?: string;
  objectId?: string;
  properties?: Record<string, any>;
}

export enum Operation {
  get_schema = 'get_schema',
  list_objects = 'list_objects',
  create_object = 'create_object',
  get_object_by_id = 'get_object_by_id',
  delete_object_by_id = 'delete_object_by_id',
}
