import { QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { TextractClient } from '@aws-sdk/client-textract';
import { analyzeDocument, analyzeS3Document } from './query_operations';

export default class Textract implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.AnalyzeDocument:
          result = await analyzeDocument(queryOptions?.document, queryOptions?.feature_types, client);
          break;

        case Operation.AnalyzeS3Document:
          result = await analyzeS3Document(
            queryOptions?.bucket,
            queryOptions?.key,
            queryOptions?.feature_types,
            client
          );
          break;
        default:
          result = { error: 'Invalid operation' };
          break;
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error?.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const credentials = {
      accessKeyId: sourceOptions.access_key,
      secretAccessKey: sourceOptions.secret_key,
    };
    return new TextractClient({ region: sourceOptions.region, credentials });
  }
}
