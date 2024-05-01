import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation, IEngagespotClientOptions } from './types';
import { EngagespotClient } from "@engagespot/node";

export default class Engagespot implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    
    let result = {};
    try {
      switch (operation) {
        case Operation.createOrUpdateUser:
          result = await this.createOrUpdateUser(client, queryOptions);
          break;
        case Operation.sendNotification:
          result = await this.sendNotification(client, queryOptions);
          break;
        case Operation.generateUserToken:
          result = await this.generateUserToken(client, queryOptions);
      }

      return {
        status: 'ok',
        data: result,
      };
      
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const connection = await this.getConnection(sourceOptions);
      return {
        status: 'ok',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message,
      };
    }
  }

  async createOrUpdateUser(client : any, queryOptions: QueryOptions): Promise<any> {
    return await client.createOrUpdateUser(queryOptions.identifier, queryOptions.profile)
  }
  
 async sendNotification(client: any, queryOptions: QueryOptions): Promise<any> {
    return await client.send({
      notification: {
        title: queryOptions.notification_title,
        message: queryOptions.message,
        url: queryOptions.url,
        icon: queryOptions.icon,
      },
      recipients: [queryOptions.reciepient],
      category : queryOptions.category,
      override: queryOptions.override,
      data: queryOptions.data
    })
  }

  async generateUserToken(client: any, queryOptions: QueryOptions): Promise <any> {
    return await client.generateUserToken(queryOptions.identifier)

  }

  async getConnection(sourceOptions: SourceOptions){
    const options: IEngagespotClientOptions = {
      apiKey: sourceOptions.apiKey,
      apiSecret: sourceOptions.apiSecret,
      ...(sourceOptions.endpoint && { baseUrl: sourceOptions.endpoint }),
      ...(sourceOptions.signingKey && { signingKey: sourceOptions.signingKey })
    };
   return EngagespotClient(options);
  }
}
