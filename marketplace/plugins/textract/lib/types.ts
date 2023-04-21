export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
};
export type QueryOptions = {
  operation?: Operation;
  bucket?: string;
  key?: string;
  document?: string;
  encoding?: BufferEncoding;
  feature_types?: string[];
};

export enum Operation {
  AnalyzeDocument = 'analyze_document',
  AnalyzeS3Document = 'analyze_document_s3',
}
