export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
  endpoint_enabled: boolean;
  endpoint: string;
  useInstanceMetadataCredentials?: boolean;
  roleArn?: string;
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
  ListBuckets = 'list_buckets',
  ListObjects = 'list_objects',
  GetObject = 'get_object',
  UploadObject = 'upload_object',
  SignedUrlForGet = 'signed_url_for_get',
  SignedUrlForPut = 'signed_url_for_put',
  RemoveObject = 'remove_object',
}

export type AssumeRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
