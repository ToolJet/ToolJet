import { QueryResult, QueryService, ConnectionTestResult, QueryError, getAuthUrl, getRefreshedToken } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, GrpcService, GrpcOperationError, GrpcClient, toError } from './types';
import * as grpc from '@grpc/grpc-js';
import {
  buildReflectionClient,
  buildProtoFileClient,
  discoverServicesUsingReflection,
  discoverServicesUsingProtoFile,
  loadProtoFromRemoteUrl,
  parseRequestData,
  buildGrpcMetadata
} from './operations';

export default class Grpcv2QueryService implements QueryService {

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId: string,
    _dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    try {
      const client = await this.createGrpcClient(sourceOptions, queryOptions.service);

      parseRequestData(queryOptions);

      const metadata = buildGrpcMetadata(sourceOptions, queryOptions.metadata);

      this.validateRequestData(queryOptions);
      this.validateMethodExists(client, queryOptions);

      const response = await this.executeGrpcCall(client, queryOptions, metadata);

      return {
        status: 'ok',
        data: response,
      };
    } catch (error: unknown) {
      if (error instanceof GrpcOperationError) {
        throw new QueryError('Query could not be completed', error.message, error.errorDetails);
      }

      const err = toError(error);
      throw new QueryError('Query could not be completed', err.message || 'An unknown error occurred', {
        grpcCode: 0,
        grpcStatus: 'UNKNOWN',
        errorType: 'QueryError'
      });
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      if (sourceOptions.proto_files === 'server_reflection') {
        const services = await this.discoverServices(sourceOptions);
        return {
          status: 'ok',
          message: `Successfully connected. Found ${services.length} service(s).`
        };
      } else {
        const packageDefinition = await loadProtoFromRemoteUrl(sourceOptions.proto_file_url!);
        const serviceNames = Object.keys(packageDefinition).filter(key =>
          typeof packageDefinition[key] === 'function'
        );
        return {
          status: 'ok',
          message: `Proto file loaded successfully. Found ${serviceNames.length} service(s).`
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: error?.description || error.message || 'Connection test failed',
      };
    }
  }

  async invokeMethod(methodName: string, ...args: any[]): Promise<unknown> {
    const methodMap: Record<string, Function> = {
      'discoverServices': this.discoverServices.bind(this)
    };

    const method = methodMap[methodName];
    if (!method) {
      throw new QueryError(
        'Method not allowed',
        `Method ${methodName} is not exposed by this plugin`,
        { allowedMethods: Object.keys(methodMap) }
      );
    }

    return await method(...args);
  }

  private async discoverServices(sourceOptions: SourceOptions): Promise<GrpcService[]> {
    try {
      this.validateSourceOptionsForDiscovery(sourceOptions);

      if (sourceOptions.proto_files === 'server_reflection') {
        return await discoverServicesUsingReflection(sourceOptions);
      } else {
        return await discoverServicesUsingProtoFile(sourceOptions);
      }
    } catch (error: unknown) {
      if (error instanceof GrpcOperationError) {
        throw new QueryError('Query could not be completed', error.message, error.errorDetails);
      }

      const err = toError(error);
      throw new QueryError('Query could not be completed', err.message, {
        grpcCode: 0,
        grpcStatus: 'UNKNOWN',
        errorType: 'QueryError'
      });
    }
  }

  private async createGrpcClient(sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> {
    if (sourceOptions.proto_files === 'server_reflection') {
      return await buildReflectionClient(sourceOptions, serviceName);
    } else {
      return await buildProtoFileClient(sourceOptions, serviceName);
    }
  }

  private validateSourceOptionsForDiscovery(sourceOptions: SourceOptions): void {
    if (!sourceOptions) {
      throw new GrpcOperationError('Source options are required for service discovery');
    }
  }

  private validateRequestData(queryOptions: QueryOptions): void {
    if (!queryOptions.request || typeof queryOptions.request !== 'object') {
      throw new GrpcOperationError('Invalid request data. Please provide a valid JSON object in the Request tab.');
    }
  }

  private validateMethodExists(client: GrpcClient, queryOptions: QueryOptions): void {
    const methodFunction = client[queryOptions.method];
    if (!methodFunction || typeof methodFunction !== 'function') {
      throw new GrpcOperationError(`Method ${queryOptions.method} not found in service ${queryOptions.service}`);
    }
  }

  private async executeGrpcCall(client: GrpcClient, queryOptions: QueryOptions, metadata: grpc.Metadata): Promise<Record<string, unknown>> {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const methodFunction = client[queryOptions.method];

      if (typeof methodFunction !== 'function') {
        reject(new GrpcOperationError(`Method ${queryOptions.method} not found on client`));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new GrpcOperationError(
          `Request timeout after 2 minutes for method ${queryOptions.method}`,
          { errorType: 'NetworkError', grpcStatus: 'DEADLINE_EXCEEDED' }
        ));
      }, 120000);

      try {
        methodFunction.call(
          client,
          queryOptions.request,
          metadata,
          (error: grpc.ServiceError | null, response?: Record<string, unknown>) => {
            clearTimeout(timeoutId);

            if (error) {
              reject(new GrpcOperationError(
                `gRPC call failed: ${error.message}`,
                error
              ));
            } else {
              resolve(response || {});
            }
          }
        );
      } catch (syncError) {
        clearTimeout(timeoutId);
        reject(new GrpcOperationError(
          `Failed to invoke gRPC method ${queryOptions.method}`,
          syncError
        ));
      }
    });
  }

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(
    sourceOptions: SourceOptions,
    error: Error,
    userId: string,
    isAppPublic: boolean
  ): Promise<Record<string, unknown>> {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
