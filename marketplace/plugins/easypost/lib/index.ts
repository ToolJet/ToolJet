import { QueryError, ConnectionTestResult } from  '@tooljet-marketplace/common';
import EasyPostClient from '@easypost/api';
import * as operations from './query_operations';

export default class EasyPostPlugin {
  async getConnection(sourceOptions: any): Promise<InstanceType<typeof EasyPostClient>> {
    const { api_key } = sourceOptions;
    return new EasyPostClient(api_key);
  }

  async testConnection(sourceOptions: any): Promise<ConnectionTestResult> {
    const { api_key } = sourceOptions;
    const client = new EasyPostClient(api_key);
    
    try {
      await client.User.retrieve('me', undefined);
      return { status: 'ok' };
    } catch (error) {
      let errorMessage = 'Failed to connect to EasyPost API';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new QueryError('Failed to connect to EasyPost API', errorMessage, {});
    }
  }

  async run(sourceOptions: any, queryOptions: any): Promise<object> {
    const { operation } = queryOptions;
    const client = await this.getConnection(sourceOptions);

    try {
      switch (operation) {
        case 'create_address':
          return await operations.createAddress(client, queryOptions);
        case 'create_shipment':
          return await operations.createShipment(client, queryOptions);
        case 'buy_shipment':
          return await operations.buyShipment(client, queryOptions);
        case 'create_tracker':
          return await operations.createTracker(client, queryOptions);
        case 'get_tracker':
          return await operations.getTracker(client, queryOptions);
        default:
          throw new Error('Unknown operation');
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          // Add any EasyPost-specific error details
        };
      }
      
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }
}