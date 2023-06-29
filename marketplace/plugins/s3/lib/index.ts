import {
  createBucket,
  getObject,
  uploadObject,
  listBuckets,
  listObjects,
  signedUrlForGet,
  signedUrlForPut,
  removeObject,
} from './query_operations';
import { S3Client } from '@aws-sdk/client-s3';
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';

export default class S3QueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.CreateBucket:
          result = await createBucket(client, queryOptions);
          break;
        case Operation.ListBuckets:
          result = await listBuckets(client, {});
          break;
        case Operation.ListObjects:
          result = await listObjects(client, queryOptions);
          break;
        case Operation.GetObject:
          result = await getObject(client, queryOptions);
          break;
        case Operation.UploadObject:
          result = await uploadObject(client, queryOptions);
          break;
        case Operation.SignedUrlForGet:
          result = await signedUrlForGet(client, queryOptions);
          break;
        case Operation.SignedUrlForPut:
          result = await signedUrlForPut(client, queryOptions);
          break;
        case Operation.RemoveObject:
          result = await removeObject(client, queryOptions);
          break;
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client: S3Client = await this.getConnection(sourceOptions);
    await listBuckets(client, {});

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const credentials = {
      accessKeyId: sourceOptions.access_key,
      secretAccessKey: sourceOptions.secret_key,
    };
    return new S3Client({ region: sourceOptions.region, credentials });
  }
}
