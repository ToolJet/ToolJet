import { Injectable } from '@nestjs/common';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { getObject, uploadObject, listBuckets, listObjects, signedUrlForGet, signedUrlForPut } from './operations';
import { Client as MinioClient, ClientOptions } from 'minio';
import { QueryError } from 'src/modules/data_sources/query.error';

@Injectable()
export default class MinioService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, _dataSourceId: string): Promise<QueryResult> {
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
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const minioClient: MinioClient = await this.getConnection(sourceOptions);
    await minioClient.listBuckets();

    return { status: 'ok' };
  }

  async getConnection(sourceOptions: any, options?: object): Promise<any> {
    const credentials: ClientOptions = {
      endPoint: sourceOptions['host'],
      port: sourceOptions['port'],
      useSSL: sourceOptions['ssl_enabled'],
      accessKey: sourceOptions['access_key'],
      secretKey: sourceOptions['secret_key'],
    };
    return new MinioClient(credentials);
  }
}
