import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SendEmailCommand, SendEmailCommandInput, SESv2Client } from '@aws-sdk/client-sesv2';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { SourceOptions, QueryOptions } from './types';
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

  async getConnection(sourceOptions: SourceOptions): Promise<SESv2Client> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const region = sourceOptions['region'];

    if (useAWSInstanceProfile) {
      return new SESv2Client({ region, credentials: fromInstanceMetadata() });
    }
    const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);

    return new SESv2Client({ region, credentials });
  }
}
