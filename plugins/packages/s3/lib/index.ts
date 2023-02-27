import {
  getObject,
  uploadObject,
  listBuckets,
  listObjects,
  signedUrlForGet,
  signedUrlForPut,
  removeObject,
} from './operations';
import AWS from 'aws-sdk';
import { S3Client } from '@aws-sdk/client-s3';

import { fromInstanceMetadata } from '@aws-sdk/credential-providers';

import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, Operation } from './types';

export default class S3QueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
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
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const region = sourceOptions['region'];

    if (useAWSInstanceProfile) {
      const client = new S3Client({ region, credentials: fromInstanceMetadata() });
      return client;
    } else {
      const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
      const endpointOptions = sourceOptions.endpoint_enabled && {
        endpoint: sourceOptions?.endpoint,
        forcePathStyle: true,
      };

      return new S3Client({ region, credentials, ...endpointOptions });
    }
  }
}
