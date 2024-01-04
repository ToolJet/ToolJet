import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SendEmailCommand, SendEmailCommandInput, SESv2Client } from '@aws-sdk/client-sesv2';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { SourceOptions, QueryOptions, AssumeRoleCredentials } from './types';
const AWS = require('aws-sdk');

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

  async getAssumeRoleCredentials(roleArn: string): Promise<AssumeRoleCredentials> {
    const sts = new AWS.STS();

    return new Promise((resolve, reject) => {
      const timestamp = new Date().getTime();
      const roleName = roleArn.split('/')[1];
      const params = {
        RoleArn: roleArn,
        RoleSessionName: `s3-${roleName}-${timestamp}`,
      };

      sts.assumeRole(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken,
          });
        }
      });
    });
  }

  async getConnection(sourceOptions: SourceOptions): Promise<SESv2Client> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const useRoleArn = sourceOptions['instance_metadata_credentials'] === 'aws_arn_role';
    const region = sourceOptions['region'];

    let credentials = null;
    if (useAWSInstanceProfile) {
      return new SESv2Client({ region, credentials: fromInstanceMetadata() });
    } else if (useRoleArn) {
      const assumeRoleCredentials = await this.getAssumeRoleCredentials(sourceOptions['role_arn']);
      credentials = new AWS.Credentials(
        assumeRoleCredentials.accessKeyId,
        assumeRoleCredentials.secretAccessKey,
        assumeRoleCredentials.sessionToken
      );
    } else {
      credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
    }

    return new SESv2Client({ region, credentials });
  }
}
