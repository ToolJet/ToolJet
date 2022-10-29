export type SourceOptions = {
  connection_string: string;
};
export type QueryOptions = {
  operation?: Operation;
  containerName?: string;
  prefix?: string;
  offset?: string;
  continuationToken?: string;
};

export enum Operation {
  ListContainers = 'list_containers',
  ListBlobs = 'list_blobs',
}
