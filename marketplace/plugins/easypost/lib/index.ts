import { QueryError, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, ErrorResponse, StandardError, EasyPostClient } from './types';
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

      if (!api_key?.trim()) {
        throw new Error('API key is required');
      }

      const client = new EasyPost(api_key.trim());

      await client.Address.all({ page_size: 1 });

      return client;
    } catch (error) {
      throw new QueryError(
        'Connection failed',
        error instanceof Error ? error.message : 'Invalid API key',
        {
          code: 'EASYPOST_CONNECTION_ERROR',
          details: {
            suggestion: 'Verify your key is active at easypost.com/dashboard',
            rawError: error instanceof Error ? error.stack : null
          }
        }
      );
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const client = await this.getConnection(sourceOptions);
      await client.Address.all({
        page_size: 1
      });
      return {
        status: 'ok',
        message: 'Successfully connected to EasyPost API'
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      throw new QueryError(
        'EasyPost connection test failed',
        error instanceof Error ? error.message : 'Invalid API key',
        {
          code: 'CONNECTION_FAILED',
          details: error instanceof Error ? { stack: error.stack } : {}
        }
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