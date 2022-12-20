export type SourceOptions = {
  connection_string: string;
};
export type QueryOptions = {
  operation?: Operation;
  containerName?: string;
  prefix?: string;
  offset?: string;
  continuationToken?: string;
  blobName?: string;
  data?: any;
  encoding?: BufferEncoding;
  contentType?: string;
};

export enum Operation {
  ListContainers = 'list_containers',
  ListBlobs = 'list_blobs',
  UploadBlob = 'upload_blob',
  ReadBlob = 'read_blob',
  DeleteBlob = 'delete_blob',
}
