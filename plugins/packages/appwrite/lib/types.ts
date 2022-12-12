export type SourceOptions = {
  host: string;
  project_id: string;
  secret_key: string;
};
export type QueryOptions = {
  operation: string;
  collectionId: string;
  limit: number;
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
