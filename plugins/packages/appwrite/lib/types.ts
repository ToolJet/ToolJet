export type SourceOptions = {
  host: string;
  project_id: string;
  secret_key: string;
};
export type QueryOptions = {
  operation: string;
  collectionId: string;
  documentId: string;
  body: any;
  document_id_key: string;
  records: Array<object>;
};
