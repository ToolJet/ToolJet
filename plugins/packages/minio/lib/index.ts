import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { Client as MinioClient, ClientOptions } from 'minio';
import {
  getObject,
  uploadObject,
  listBuckets,
  listObjects,
  signedUrlForGet,
  signedUrlForPut,
  removeObject,
} from './operations';
import { SourceOptions, QueryOptions } from './types';

export default class MinioService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const minioClient = await this.getConnection(sourceOptions, { operation });
    let result = {};

    try {
      switch (operation) {
        case 'list_buckets':
          result = await listBuckets(minioClient, queryOptions);
          break;
        case 'list_objects':
          result = await listObjects(minioClient, queryOptions);
          break;
        case 'get_object':
          result = await getObject(minioClient, queryOptions);
          break;
        case 'put_object':
          result = await uploadObject(minioClient, queryOptions);
          break;
        case 'signed_url_for_get':
          result = await signedUrlForGet(minioClient, queryOptions);
          break;
        case 'signed_url_for_put':
          result = await signedUrlForPut(minioClient, queryOptions);
          break;
        case 'remove_object':
          result = await removeObject(minioClient, queryOptions);
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
    const minioClient: MinioClient = await this.getConnection(sourceOptions);
    await minioClient.listBuckets();

    return { status: 'ok' };
  }

  async getConnection(sourceOptions: SourceOptions, options?: object): Promise<any> {
    const credentials: ClientOptions = {
      endPoint: sourceOptions['host'],
      port: +sourceOptions['port'],
      useSSL: !!sourceOptions['ssl_enabled'],
      accessKey: sourceOptions['access_key'],
      secretKey: sourceOptions['secret_key'],
    };
    return new MinioClient(credentials);
  }
}
