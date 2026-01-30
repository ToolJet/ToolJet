import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SendEmailCommand, SendEmailCommandInput, SESv2Client } from '@aws-sdk/client-sesv2';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { SourceOptions, QueryOptions, AssumeRoleCredentials } from './types';

export default class AmazonSES implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let res = null;
    const client = await this.getConnection(sourceOptions);
    const command: SendEmailCommandInput = {
      FromEmailAddress: queryOptions.send_mail_from,
      ReplyToAddresses: queryOptions.reply_to,
      Destination: {
        ToAddresses: queryOptions.send_mail_to,
        CcAddresses: queryOptions.cc_to,
        BccAddresses: queryOptions.bcc_to,
      },
      Content: {
        Simple: {
          Subject: {
            Data: queryOptions.subject,
          },
          Body: {
            Html: {
              Data: queryOptions.body,
              Charset: 'UTF-8',
            },
          },
        },
      },
    };
    try {
      const cmd = new SendEmailCommand(command);
      res = await client.send(cmd);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: res,
    };
  }

  async getAssumeRoleCredentials(roleArn: string, region: string): Promise<AssumeRoleCredentials> {
    const sts = new STSClient({ region });

    const timestamp = new Date().getTime();
    const roleName = roleArn.split('/')[1];
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `s3-${roleName}-${timestamp}`,
    });

    try {
      const data = await sts.send(command);
      return {
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken,
      };
    } catch (error) {
      throw new QueryError('Failed to assume role', error.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<SESv2Client> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const useRoleArn = sourceOptions['instance_metadata_credentials'] === 'aws_arn_role';
    const region = sourceOptions['region'];

    if (useAWSInstanceProfile) {
      return new SESv2Client({ region, credentials: fromInstanceMetadata() });
    } else if (useRoleArn) {
      const assumeRoleCredentials = await this.getAssumeRoleCredentials(sourceOptions['role_arn'], region);
      return new SESv2Client({
        region,
        credentials: {
          accessKeyId: assumeRoleCredentials.accessKeyId,
          secretAccessKey: assumeRoleCredentials.secretAccessKey,
          sessionToken: assumeRoleCredentials.sessionToken,
        },
      });
    } else {
      return new SESv2Client({
        region,
        credentials: {
          accessKeyId: sourceOptions['access_key'],
          secretAccessKey: sourceOptions['secret_key'],
        },
      });
    }
  }
}
