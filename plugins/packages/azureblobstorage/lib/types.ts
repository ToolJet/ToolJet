export type SourceOptions = {
  connection_string: string;
};
export type QueryOptions = {
  operation?: Operation;
  containerName?: string;
  prefix?: string;
  maxPageSize?: string;
  continuationToken?: string;
  blobName?: string;
  data?: string;
  encoding?: BufferEncoding;
  contentType?: string;
};

export enum Operation {
  CreateContainer = 'create_container',
  ListContainers = 'list_containers',
  ListBlobs = 'list_blobs',
  UploadBlob = 'upload_blob',
  ReadBlob = 'read_blob',
  DeleteBlob = 'delete_blob',
}
