import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { QdrantClient } from '@qdrant/js-client-rest';
import { deletePoints, getCollectionInfo, getPoints, listCollections, queryPoints, upsertPoints } from './operations';

export default class Qdrant implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const qdrant = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.GetCollectionInfo:
          result = await getCollectionInfo(qdrant, queryOptions);
          break;
        case Operation.ListCollections:
          result = await listCollections(qdrant, queryOptions);
          break;
        case Operation.GetPoints:
          result = await getPoints(qdrant, queryOptions);
          break;
        case Operation.UpsertPoints:
          result = await upsertPoints(qdrant, queryOptions);
          break;
        case Operation.DeletePoints:
          result = await deletePoints(qdrant, queryOptions);
          break;
        case Operation.QueryPoints:
          result = await queryPoints(qdrant, queryOptions);
          break;
        default:
          throw new QueryError('Unsupported Operation', operation + " is not supported.", {});
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
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const qdrant = await this.getConnection(sourceOptions);

    try {
      await qdrant.getCollections();
      console.log('Connection successful.');
      return { status: 'ok' };
    } catch (error) {
      console.error('Connection could not be established:', error.message);
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<QdrantClient> {
    const { apiKey, url } = sourceOptions;

    if (!url) {
      throw new QueryError('URL missing', 'No Qdrant URL provided in source options', {});
    }

    return new QdrantClient({
      url,
      apiKey,
    });
  }

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON.parse(json);
  }
}
