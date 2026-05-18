import {
  createBucket,
  getObject,
  uploadObject,
  listBuckets,
  listObjects,
  signedUrlForGet,
  signedUrlForPut,
  removeObject,
} from './operations';
import { S3Client } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand, AssumeRoleCommandOutput } from '@aws-sdk/client-sts';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';

import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, Operation, AssumeRoleCredentials } from './types';

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

  async getAssumeRoleCredentials(roleArn: string, region: string): Promise<AssumeRoleCredentials> {
    const stsClient = new STSClient({ region });

    const timestamp = new Date().getTime();
    const roleName = roleArn.split('/')[1];

    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `s3-${roleName}-${timestamp}`,
    });

    try {
      const data: AssumeRoleCommandOutput = await stsClient.send(command);

      return {
        accessKeyId: data.Credentials?.AccessKeyId,
        secretAccessKey: data.Credentials?.SecretAccessKey,
        sessionToken: data.Credentials?.SessionToken,
      };
    } catch (err) {
      throw new Error(`Failed to assume role: ${err.message}`);
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<S3Client> {
    const region = sourceOptions['region'];
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const useRoleArn = sourceOptions['instance_metadata_credentials'] === 'aws_arn_role';
    const useDefaultCredentialProviderChain =
      sourceOptions['instance_metadata_credentials'] === 'default_credentials_provider_chain';

    if (useAWSInstanceProfile) {
      const client = new S3Client({
        region,
        credentials: fromInstanceMetadata({
          timeout: 5000,
          maxRetries: 1,
        }),
      });
      return client;
    } else if (useRoleArn) {
      const assumeRoleCredentials = await this.getAssumeRoleCredentials(sourceOptions['role_arn'], region);

      const client = new S3Client({
        region,
        credentials: {
          accessKeyId: assumeRoleCredentials.accessKeyId,
          secretAccessKey: assumeRoleCredentials.secretAccessKey,
          sessionToken: assumeRoleCredentials.sessionToken,
        },
      });
      return client;
    } else if (useDefaultCredentialProviderChain) {
      const client = new S3Client({ region });
      return client;
    } else {
      const credentials = {
        accessKeyId: sourceOptions['access_key'],
        secretAccessKey: sourceOptions['secret_key'],
      };

      const endpointOptions = sourceOptions.endpoint_enabled && {
        endpoint: sourceOptions?.endpoint,
        forcePathStyle: true,
      };

      return new S3Client({ region, credentials, ...endpointOptions });
    }
  }
}
