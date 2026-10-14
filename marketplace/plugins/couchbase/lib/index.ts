import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getDocument, createDocument, updateDocument, deleteDocument, queryDocument, search } from './query_operations';

export default class CouchbaseService implements QueryService {
  // Function to run the specified operation
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    let result = {};

    try {
      switch (operation) {
        case Operation.GetDocument:
          result = await getDocument(queryOptions, sourceOptions);
          break;
        case Operation.CreateDocument:
          result = await createDocument(queryOptions, sourceOptions);
          break;
        case Operation.UpdateDocument:
          result = await updateDocument(queryOptions, sourceOptions);
          break;
        case Operation.DeleteDocument:
          result = await deleteDocument(queryOptions, sourceOptions);
          break;
        case Operation.Query:
          result = await queryDocument(queryOptions, sourceOptions);
          break;
        case Operation.FtsSearch:
          result = await search(queryOptions, sourceOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = {
          name: error.name,
          code: (error as any).code || null,
          codeName: (error as any).codeName || null,
          keyPattern: (error as any).keyPattern || null,
          keyValue: (error as any).keyValue || null,
        };
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  // Function to test the Couchbase connection
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connectionConfig = await this.getConnection(sourceOptions);
    const testUrl = `${connectionConfig.data_api_url}/v1/callerIdentity`;
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${connectionConfig.username}:${connectionConfig.password}`).toString(
            'base64'
          )}`,
        },
      });
      if (!response.ok) {
        throw new QueryError('Connection failed', `Failed to connect: ${response.statusText}`, {});
      }

      console.log('Connection successful to Couchbase');
      return { status: 'ok' };
    } catch (error) {
      console.error('Connection could not be established for url:', testUrl, 'error is ', error.message);
      throw new QueryError(
        `Connection could not be established for url: ${testUrl} error is ${error.message}`,
        error.message,
        {}
      );
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<SourceOptions> {
    const { username, password, data_api_url } = sourceOptions;

    if (!username || !password || !data_api_url) {
      throw new QueryError('Connection parameters missing', 'Username, password, and data_api_url are required', {});
    }

    return {
      username,
      password,
      data_api_url,
    };
  }
}
