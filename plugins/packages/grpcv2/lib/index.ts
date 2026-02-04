import { QueryResult, QueryService, ConnectionTestResult, QueryError, getAuthUrl, getRefreshedToken } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, GrpcService, GrpcOperationError, GrpcClient, toError } from './types';
import * as grpc from '@grpc/grpc-js';
import JSON5 from 'json5';
import {
  buildReflectionClient,
  buildProtoFileClient,
  buildFilesystemClient,
  discoverServicesUsingReflection,
  discoverServicesUsingProtoUrl,
  discoverServicesUsingFilesystem,
  loadProtoFromRemoteUrl,
  extractServicesFromGrpcPackage,
  executeGrpcMethod
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

      this.validateRequestData(queryOptions);
      this.validateMethodExists(client, queryOptions);

      const response = await this.executeGrpcCall(client, queryOptions, sourceOptions);

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
      let services: GrpcService[];

      switch (sourceOptions.proto_files) {
        case 'server_reflection':
          services = await discoverServicesUsingReflection(sourceOptions);
          break;

        case 'import_proto_file':
          const packageDefinition = await loadProtoFromRemoteUrl(sourceOptions.proto_file_url!);
          const grpcObject = grpc.loadPackageDefinition(packageDefinition);
          services = extractServicesFromGrpcPackage(grpcObject);
          break;

        case 'import_protos_from_filesystem':
          services = await discoverServicesUsingFilesystem(sourceOptions);
          break;

        default:
          return {
            status: 'failed',
            message: `Unsupported proto_files option: ${sourceOptions.proto_files}`
          };
      }

      if (services.length === 0) {
        return {
          status: 'failed',
          message: 'No services found',
        };
      }

      return await this.checkFirstServiceConnection(sourceOptions, services);
    } catch (error) {
      return {
        status: 'failed',
        message: error?.description || error.message || 'Connection test failed',
      };
    }
  }

  private async checkFirstServiceConnection(
    sourceOptions: SourceOptions,
    services: GrpcService[],
    failures?: Array<{ file: string; error: string }>
  ): Promise<ConnectionTestResult> {
    const firstService = services[0].name;
    try {
      const client = await this.createGrpcClient(sourceOptions, firstService);

      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 60);

      const waitForReadyAsync = (client: GrpcClient, deadline: Date): Promise<void> => {
        return new Promise((resolve, reject) => {
          client.waitForReady(deadline, (error: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      };

      try {
        await waitForReadyAsync(client, deadline);
      } catch (error) {
        throw new Error(`Cannot connect to host: ${error.message}`);
      }

      let message = `Successfully connected. Found ${services.length} service(s)`;
      if (failures && failures.length > 0) {
        message += `. Note: ${failures.length} proto file(s) skipped due to errors`;
      }
      message += '.';

      return {
        status: 'ok',
        message: message
      };
    } catch (connectionError) {
      return {
        status: 'failed',
        message: `Connection error: ${connectionError?.message || 'Failed to connect to gRPC server'}`,
      };
    }
  }

  async invokeMethod(methodName: string, ...args: any[]): Promise<QueryResult> {
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

      switch (sourceOptions.proto_files) {
        case 'server_reflection':
          return await discoverServicesUsingReflection(sourceOptions);

        case 'import_proto_file':
          return await discoverServicesUsingProtoUrl(sourceOptions);

        case 'import_protos_from_filesystem':
          return await discoverServicesUsingFilesystem(sourceOptions);

        default:
          throw new GrpcOperationError(
            `Unsupported proto_files option: ${sourceOptions.proto_files}. ` +
            `Supported options are: 'server_reflection', 'import_proto_file', 'import_protos_from_filesystem'`
          );
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
    // TODO: Can cache clients based on sourceOptions 
    switch (sourceOptions.proto_files) {
      case 'server_reflection':
        return await buildReflectionClient(sourceOptions, serviceName);

      case 'import_proto_file':
        return await buildProtoFileClient(sourceOptions, serviceName);

      case 'import_protos_from_filesystem':
        return await buildFilesystemClient(sourceOptions, serviceName);

      default:
        throw new GrpcOperationError(`Unsupported proto_files option: ${sourceOptions.proto_files}`);
    }
  }

  private validateSourceOptionsForDiscovery(sourceOptions: SourceOptions): void {
    if (!sourceOptions) {
      throw new GrpcOperationError('Source options are required for service discovery');
    }
  }

  private validateRequestData(queryOptions: QueryOptions): void {
    const message = this.parseMessage(queryOptions.raw_message);
    if (!message || typeof message !== 'object') {
      throw new GrpcOperationError('Invalid message data. Please provide a valid JSON object in the Request tab.');
    }
  }

  private parseMessage(raw_message?: string): Record<string, unknown> {
    if (!raw_message || raw_message.trim() === '') {
      return {};
    }

    try {
      return JSON5.parse(raw_message);
    } catch (error) {
      const err = toError(error);
      throw new GrpcOperationError(`Invalid JSON in request message: ${err.message}`, error);
    }
  }

  private validateMethodExists(client: GrpcClient, queryOptions: QueryOptions): void {
    const methodFunction = client[queryOptions.method];
    if (!methodFunction || typeof methodFunction !== 'function') {
      throw new GrpcOperationError(`Method ${queryOptions.method} not found in service ${queryOptions.service}`);
    }
  }

  private async executeGrpcCall(client: GrpcClient, queryOptions: QueryOptions, sourceOptions: SourceOptions): Promise<Record<string, unknown>> {
    const message = this.parseMessage(queryOptions.raw_message);
    return executeGrpcMethod(client, queryOptions.method, message, sourceOptions, queryOptions);
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
