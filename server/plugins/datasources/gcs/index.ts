import { Injectable } from '@nestjs/common';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { listBuckets, signedUrlForGet, signedUrlForPut, listFiles, getFile, uploadFile } from './operations';
import { QueryError } from 'src/modules/data_sources/query.error';
import { Storage } from '@google-cloud/storage';

@Injectable()
export default class GcsQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, _dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case 'list_buckets':
          result = await listBuckets(client, {});
          break;
        case 'list_files':
          result = await listFiles(client, queryOptions);
          break;
        case 'get_file':
          result = await getFile(client, queryOptions);
          break;
        case 'upload_file':
          result = await uploadFile(client, queryOptions);
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

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const client: Storage = await this.getConnection(sourceOptions);
    await listBuckets(client, {});

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any, _options?: object): Promise<any> {
    const privateKey = JSON.parse(sourceOptions['private_key']);
    const storage = new Storage({
      projectId: privateKey['project_id'],
      credentials: {
        client_email: privateKey['client_email'],
        private_key: privateKey['private_key'],
      },
    });

    return storage;
  }
}
