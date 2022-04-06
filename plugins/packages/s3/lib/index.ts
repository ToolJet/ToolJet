import { getObject, uploadObject, listBuckets, listObjects, signedUrlForGet, signedUrlForPut } from './operations';
import { S3Client } from '@aws-sdk/client-s3';
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class S3QueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions, { operation });
    let result = {};

    try {
      switch (operation) {
        case 'list_buckets':
          result = await listBuckets(client, {});
          break;
        case 'list_objects':
          result = await listObjects(client, queryOptions);
          break;
        case 'get_object':
          result = await getObject(client, queryOptions);
          break;
        case 'upload_object':
          result = await uploadObject(client, queryOptions);
          break;
        case 'signed_url_for_get':
          result = await signedUrlForGet(client, queryOptions);
          break;
        case 'signed_url_for_put':
          result = await signedUrlForPut(client, queryOptions);
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
    const client: S3Client = await this.getConnection(sourceOptions, {
      operation: 'list_objects',
    });
    await listBuckets(client, {});

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions, options?: object): Promise<any> {
    const credentials = {
      accessKeyId: sourceOptions['access_key'],
      secretAccessKey: sourceOptions['secret_key'],
    };
    return new S3Client({ region: sourceOptions['region'], credentials });
  }
}
