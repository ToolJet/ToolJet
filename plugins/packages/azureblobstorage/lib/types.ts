export type SourceOptions = {
  connection_string: string;
};
export type QueryOptions = {
  operation?: Operation;
  bucket?: string;
  prefix?: string;
  key?: string;
  contentType?: string;
  encoding?: BufferEncoding;
  expiresIn?: number;
  data?: string | number;
};

export enum Operation {
  ListContainers = 'list_containers',
}
