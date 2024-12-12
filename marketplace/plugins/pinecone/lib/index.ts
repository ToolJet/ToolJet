import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import {
  getIndexStats,
  listVectorIds,
  fetchVectors,
  upsertVectors,
  updateVector,
  deleteVectors,
  quertVectors,
} from './query_operations';
import { Pinecone } from '@pinecone-database/pinecone';

export default class PineconeService implements QueryService {
  // Function to run the specified operation
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const pinecone = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.GetIndexStats:
          result = await getIndexStats(pinecone, queryOptions);
          break;
        case Operation.ListVectorIds:
          result = await listVectorIds(pinecone, queryOptions);
          break;
        case Operation.FetchVectors:
          result = await fetchVectors(pinecone, queryOptions);
          break;
        case Operation.UpsertVectors:
          result = await upsertVectors(pinecone, queryOptions);
          break;
        case Operation.UpdateVector:
          result = await updateVector(pinecone, queryOptions);
          break;
        case Operation.DeleteVectors:
          result = await deleteVectors(pinecone, queryOptions);
          break;
        case Operation.QueryVectors:
          result = await quertVectors(pinecone, queryOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error?.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  // Function to test the Pinecone connection
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const pinecone = await this.getConnection(sourceOptions);

    try {
      const indexes = await pinecone.listIndexes();
      console.log('Indexes fetched:', indexes);

      if (indexes.indexes.length > 0) {
        console.log('Connection successful, indexes found');
        return { status: 'ok' };
      } else {
        console.error('No indexes found');
        throw new QueryError('No indexes found', 'The index list is empty', {});
      }
    } catch (error) {
      console.error('Connection could not be established:', error.message);
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<Pinecone> {
    const { apiKey } = sourceOptions;

    if (!apiKey) {
      throw new QueryError('API key missing', 'No API key provided in source options', {});
    }

    const pinecone = new Pinecone({
      apiKey: apiKey,
    });

    return pinecone;
  }
}
