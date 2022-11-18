import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SendEmailCommand, SendEmailCommandInput, SESv2Client } from '@aws-sdk/client-sesv2';
import { SourceOptions, QueryOptions } from './types';

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
            Text: {
              Data: queryOptions.text,
            },
            Html: {
              Data: queryOptions.html,
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
    const credentials = {
      accessKeyId: sourceOptions.access_key,
      secretAccessKey: sourceOptions.secret_key,
    };
    return new SESv2Client({ region: sourceOptions.region, credentials });
  }
}
