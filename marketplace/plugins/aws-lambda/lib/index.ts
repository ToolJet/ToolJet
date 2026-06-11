import { QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SourceOptions, QueryOptions } from './types';

export default class AWSLambda implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const lambdaClient = new LambdaClient({
      region: sourceOptions.region,
      credentials: {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_key,
      },
    });

    const command = new InvokeCommand({
      FunctionName: queryOptions.functionName,
      Payload: queryOptions.payload,
    });

    try {
      const response = await lambdaClient.send(command);

      // Convert Uint8Array to a string and parse it as JSON
      let responseData;
      if (response.Payload instanceof Uint8Array) {
        const payloadString = new TextDecoder().decode(response.Payload);
        responseData = JSON.parse(payloadString);
      } else {
        responseData = response.Payload; // Fallback if it's not a Uint8Array
      }

      return {
        status: 'ok',
        data: responseData,
      };
    } catch (error) {
      throw new QueryError('Query could not be completed: ' + error.message, error.message, {});
    }
  }
}
