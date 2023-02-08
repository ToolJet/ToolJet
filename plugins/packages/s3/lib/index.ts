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
// import { S3Client } from '@aws-sdk/client-s3';
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
    const isSuccess = await this.getConnection(sourceOptions);

    if (isSuccess) {
      const s3CLient = new AWS.S3();

      const buckets = await s3CLient.listBuckets().promise();

      console.log('buckets 2.o ===>', buckets);
      return {
        status: 'ok',
        message: 'Connection successful',
      };
    }

    return {
      status: 'failed',
      message: 'Connection failed',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const region = sourceOptions['region'];

    let credentials = null;
    if (useAWSInstanceProfile) {
      const metadataCredentials = new AWS.EC2MetadataCredentials({
        httpOptions: { timeout: 5000 },
        maxRetries: 10,
      });

      return metadataCredentials.refresh(async (error) => {
        if (error) {
          console.error(error);
        } else {
          credentials = new AWS.Credentials(
            metadataCredentials['metadata'].AccessKeyId,
            metadataCredentials['metadata'].SecretAccessKey,
            metadataCredentials['metadata'].Token
          );
          console.log('--meta creds 1.0-----', credentials);
          AWS.config.update({ region, credentials });

          return true;
        }
      });
    } else {
      const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
      const endpointOptions = sourceOptions.endpoint_enabled && {
        endpoint: sourceOptions?.endpoint,
        forcePathStyle: true,
      };

      AWS.config.update({
        credentials: credentials,
        region: region,
        ...endpointOptions,
      });

      return true;
    }
  }
}
