import { QueryError, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, ErrorResponse, StandardError,EasyPostClient } from './types';
import EasyPost from '@easypost/api';
import * as operations from './query_operations';

export default class EasyPostPlugin {
  private standardizeError(error: unknown): StandardError {
    if (typeof error === 'string') {
      return { message: error };
    }

    if (error instanceof Error) {
      return { 
        message: error.message,
        ...(error.stack && { details: { stack: error.stack } })
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as ErrorResponse;
      if (err.error) {
        return {
          code: err.error.code,
          message: err.error.message,
          details: {
            errors: err.error.errors,
            status: err.status
          }
        };
      }
    }

    return { message: 'An unknown error occurred' };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<EasyPostClient> {
    try {
      const { api_key } = sourceOptions;
      if (!api_key) {
        throw new Error('API key is required');
      }
      if (!api_key.startsWith('EZTEST_') && !api_key.startsWith('EZPROD_')) {
        throw new Error('Invalid API key format. Must start with EZTEST_ or EZPROD_');
      }
      return new EasyPost(api_key);
    } catch (error) {
      const standardized = this.standardizeError(error);
      throw new QueryError(
        'Failed to create EasyPost connection',
        standardized.message,
        standardized.details
      );
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const client = await this.getConnection(sourceOptions);
      await client.User.retrieve('me', '');
      return { status: 'ok' };
    } catch (error) {
      const standardized = this.standardizeError(error);
      throw new QueryError(
        'EasyPost connection test failed',
        standardized.message,
        standardized.details
      );
    }
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<object> {
    try {
      const { operation } = queryOptions;
      const client = await this.getConnection(sourceOptions);

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
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      const standardized = this.standardizeError(error);
      throw new QueryError(
        'EasyPost operation failed',
        standardized.message,
        standardized.details
      );
    }
  }
}