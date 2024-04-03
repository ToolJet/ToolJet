export type SourceOptions = {
  host: string;
  project_id: string;
  secret_key: string;
  database_id: string;
};
export type QueryOptions = {
  operation: string;
  collectionId: string;
  limit: string;
  documentId: string;
  body: any;
  document_id_key: string;
  records: Array<object>;
  order_fields: string[];
  order_types: string[];
  where_field: string;
  where_operation: string;
  where_value: string;
};
