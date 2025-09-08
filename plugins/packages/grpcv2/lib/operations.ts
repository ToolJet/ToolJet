import { SourceOptions, QueryOptions, GrpcService, GrpcMethod, GrpcClient, UnaryMethodFunction, GrpcOperationError, toError, isRecord } from './types';
import { sanitizeHeaders } from '@tooljet-plugins/common';
import got from 'got';
import { GrpcReflection, serviceHelper } from 'grpc-js-reflection-client';
import type { ListMethodsType } from 'grpc-js-reflection-client/dist/Types/ListMethodsType';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';


export const buildReflectionClient = async (sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> => {
  try {
    const credentials = buildChannelCredentials(sourceOptions);
    const cleanUrl = sanitizeGrpcServerUrl(sourceOptions.url, sourceOptions.ssl_enabled);

    const client = await serviceHelper({
      host: cleanUrl,
      servicePath: serviceName,
      credentials,
      proto_symbol: serviceName,
      protoLoaderOptions: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    });

    return client;
  } catch (error: unknown) {
    const err = toError(error);
    throw new GrpcOperationError(`Failed to create reflection client for service ${serviceName}: ${err.message}`, error);
  }
};

export const buildProtoFileClient = async (sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> => {
  try {
    const packageDefinition = await loadProtoFromRemoteUrl(sourceOptions.proto_file_url!);
    const grpcObject = grpc.loadPackageDefinition(packageDefinition);

    const service = findServiceInPackage(grpcObject, serviceName);
    if (!service) {
      throw new GrpcOperationError(`Service ${serviceName} not found in proto file`);
    }

    const credentials = buildChannelCredentials(sourceOptions);
    const cleanUrl = sanitizeGrpcServerUrl(sourceOptions.url, sourceOptions.ssl_enabled);

    if (typeof service !== 'function') {
      throw new GrpcOperationError(`Service ${serviceName} is not a valid constructor function`);
    }
    // Type assertion necessary for constructor function interface
    const ServiceConstructor = service as new (url: string, credentials: any) => GrpcClient;
    const client = new ServiceConstructor(cleanUrl, credentials);
    return client;
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Failed to create proto file client for service ${serviceName}: ${err.message}`, error);
  }
};

export const createTransportCredentials = (sourceOptions: SourceOptions): grpc.ChannelCredentials => {
  if (sourceOptions.ssl_enabled) {
    const options: {
      rootCerts?: Buffer;
      privateKey?: Buffer;
      certChain?: Buffer;
    } = {};

    if (sourceOptions.ssl_certificate === 'ca_certificate' && sourceOptions.ca_cert) {
      options.rootCerts = Buffer.from(sourceOptions.ca_cert);
    } else if (sourceOptions.ssl_certificate === 'client_certificate') {
      options.rootCerts = sourceOptions.ca_cert ? Buffer.from(sourceOptions.ca_cert) : undefined;
      options.privateKey = sourceOptions.client_key ? Buffer.from(sourceOptions.client_key) : undefined;
      options.certChain = sourceOptions.client_cert ? Buffer.from(sourceOptions.client_cert) : undefined;
    }

    return grpc.credentials.createSsl(
      options.rootCerts,
      options.privateKey,
      options.certChain
    );
  } else {
    return grpc.credentials.createInsecure();
  }
};

export const sanitizeGrpcServerUrl = (url: string, sslEnabled: boolean = false): string => {
  if (!url || typeof url !== 'string') {
    throw new GrpcOperationError('URL is required for gRPC connection. Please provide a valid server URL (e.g., grpcb.in:9001)');
  }

  const protocolPrefixes = [
    'grpc://',
    'grpcs://',
    'http://',
    'https://'
  ];

  let cleanUrl = url.trim();

  if (!cleanUrl) {
    throw new GrpcOperationError('URL cannot be empty. Please provide a valid server URL (e.g., grpcb.in:9001)');
  }

  for (const prefix of protocolPrefixes) {
    if (cleanUrl.toLowerCase().startsWith(prefix)) {
      cleanUrl = cleanUrl.slice(prefix.length);
      break;
    }
  }

  if (!cleanUrl.includes(':')) {
    const defaultPort = sslEnabled ? 443 : 80;
    cleanUrl = `${cleanUrl}:${defaultPort}`;
  }

  const urlParts = cleanUrl.split(':');
  if (urlParts.length !== 2 || !urlParts[0] || !urlParts[1]) {
    throw new GrpcOperationError(`Invalid URL format: "${url}". Expected format: host:port (e.g., grpcb.in:9001)`);
  }

  const port = parseInt(urlParts[1], 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new GrpcOperationError(`Invalid port number: "${urlParts[1]}". Port must be between 1 and 65535`);
  }

  return cleanUrl;
};

export const discoverServicesUsingReflection = async (sourceOptions: SourceOptions): Promise<GrpcService[]> => {
  try {
    if (!sourceOptions.url) {
      throw new GrpcOperationError('Server URL is required for gRPC service discovery. Please configure the server URL in your data source settings.');
    }

    const reflectionClient = await createReflectionClient(sourceOptions);
    const callOptions = prepareGrpcCallOptions(sourceOptions);
    const serviceNames: string[] = await reflectionClient.listServices('*', callOptions);

    if (!serviceNames || serviceNames.length === 0) {
      throw new GrpcOperationError('No services found via reflection');
    }

    const services: GrpcService[] = [];

    for (const serviceName of serviceNames) {
      try {
        const methods: ListMethodsType[] = await reflectionClient.listMethods(serviceName, callOptions);

        const grpcMethods: GrpcMethod[] = methods.map((methodInfo: ListMethodsType) => {
          if (!methodInfo || typeof methodInfo.name !== 'string') {
            throw new Error(`Invalid method info for service ${serviceName}`);
          }

          return {
            name: methodInfo.name,
            requestStreaming: Boolean(methodInfo.definition.requestStream),
            responseStreaming: Boolean(methodInfo.definition.responseStream),
          };
        });

        services.push({
          name: serviceName,
          methods: grpcMethods,
        });

      } catch (error: unknown) {
        const err = toError(error);
        console.warn(`Could not get methods for service ${serviceName}: ${err.message}`);
        services.push({
          name: serviceName,
          methods: [],
        });
      }
    }

    return services;
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Service discovery via reflection failed: ${err.message}`, error);
  }
};

export const discoverServicesUsingProtoFile = async (sourceOptions: SourceOptions): Promise<GrpcService[]> => {
  try {
    if (!sourceOptions.proto_file_url) {
      throw new GrpcOperationError('Proto file URL is required for service discovery when using proto URL method.');
    }

    const packageDefinition = await loadProtoFromRemoteUrl(sourceOptions.proto_file_url);
    const grpcObject = grpc.loadPackageDefinition(packageDefinition);

    return extractServicesFromGrpcPackage(grpcObject);
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Service discovery via proto file failed: ${err.message}`, error);
  }
};

export const extractServicesFromGrpcPackage = (grpcObject: grpc.GrpcObject): GrpcService[] => {
  const services: GrpcService[] = [];

  const extractFromObject = (
    obj: grpc.GrpcObject,
    prefix: string = ''
  ): void => {
    for (const [key, value] of Object.entries(obj)) {
      if (isServiceDefinition(value)) {
        const serviceName = prefix ? `${prefix}.${key}` : key;

        try {
          const methods = extractMethodsFromService(value, serviceName);
          if (methods.length > 0) {
            services.push({
              name: serviceName,
              methods,
            });
          }
        } catch (error) {
          console.warn(`Could not extract methods for service ${serviceName}:`, error);
          services.push({
            name: serviceName,
            methods: [],
          });
        }
      } else if (isNamespace(value)) {
        const nestedPrefix = prefix ? `${prefix}.${key}` : key;
        extractFromObject(value as grpc.GrpcObject, nestedPrefix);
      }
    }
  };

  extractFromObject(grpcObject);

  if (services.length === 0) {
    throw new GrpcOperationError('No services found in the proto file. Please verify the proto file contains valid service definitions.');
  }

  return services;
};

export const extractMethodsFromService = (
  serviceDefinition: grpc.ServiceDefinition,
  serviceName: string
): GrpcMethod[] => {
  const methods: GrpcMethod[] = [];

  try {
    const serviceObj = serviceDefinition?.service;

    if (!isRecord(serviceObj)) {
      console.warn(`No service object found for ${serviceName}`);
      return methods;
    }

    for (const [methodName, methodDefinition] of Object.entries(serviceObj)) {
      if (isMethodDefinition(methodDefinition)) {
        const method: GrpcMethod = {
          name: methodName,
          requestStreaming: Boolean(methodDefinition.requestStream),
          responseStreaming: Boolean(methodDefinition.responseStream),
        };

        methods.push(method);
      }
    }
  } catch (error) {
    console.warn(`Error extracting methods from service ${serviceName}:`, error);
  }

  return methods;
};

export const loadProtoFromRemoteUrl = async (url: string): Promise<protoLoader.PackageDefinition> => {
  try {
    const response = await got(url, {
      timeout: {
        request: 30000
      },
      responseType: 'text'
    });

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `grpc-proto-${Date.now()}.proto`);

    try {
      fs.writeFileSync(tempFile, response.body);

      const packageDefinition = protoLoader.loadSync(tempFile, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });

      return packageDefinition;
    } finally {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp proto file:', cleanupError);
      }
    }
  } catch (error: unknown) {
    const err = toError(error);
    let errorMessage = `Failed to load proto file from URL: ${err.message}`;

    if (isRecord(err)) {
      if (isRecord(err.response)) {
        const response = err.response;
        if (typeof response.statusCode === 'number' && typeof response.statusMessage === 'string') {
          errorMessage = `Failed to load proto file from URL (HTTP ${response.statusCode}): ${response.statusMessage}`;
        }
      } else if (typeof err.code === 'string') {
        errorMessage = `Failed to load proto file from URL (${err.code}): ${err.message}`;
      }
    }

    throw new GrpcOperationError(errorMessage, error);
  }
};

export const findServiceInPackage = (grpcObject: grpc.GrpcObject, serviceName: string): (new (url: string, credentials: any) => GrpcClient) | null => {
  const parts = serviceName.split('.');
  let current: any = grpcObject;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return recursiveServiceSearch(grpcObject, serviceName);
    }
  }

  if (typeof current === 'function') {
    // Type assertion necessary: grpc.GrpcObject can contain constructor functions
    return current as (new (url: string, credentials: any) => GrpcClient);
  }

  return recursiveServiceSearch(grpcObject, serviceName);
};


/**
 * Prepare gRPC call options for NON-TLS connections only
 * Handles ALL metadata (datasource + auth + query) via CallCredentials
 * Note: This function is only called when ssl_enabled = false
 */
export const prepareGrpcCallOptions = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.CallOptions => {
  const allMetadata = new grpc.Metadata();

  // 1. Add datasource metadata (client-id, cp-env, etc.)
  if (sourceOptions.metadata && Array.isArray(sourceOptions.metadata) && sourceOptions.metadata.length > 0) {
    const sanitizedDatasourceMetadata = sanitizeDatasourceMetadata(sourceOptions);
    Object.entries(sanitizedDatasourceMetadata).forEach(([key, value]) => {
      if (key && value) {
        allMetadata.set(key, String(value));
      }
    });
  }

  // 2. Add query metadata
  if (queryOptions?.metadata && Array.isArray(queryOptions.metadata) && queryOptions.metadata.length > 0) {
    const sanitizedQueryMetadata = sanitizeQueryMetadata(queryOptions);
    Object.entries(sanitizedQueryMetadata).forEach(([key, value]) => {
      if (key && value) {
        allMetadata.set(key, String(value));
      }
    });
  }

  // 3. Add auth metadata based on auth_type (using raw sourceOptions values)
  switch (sourceOptions.auth_type) {
    case 'api_key':
      if (sourceOptions.grpc_apikey_key && sourceOptions.grpc_apikey_value) {
        allMetadata.set(sourceOptions.grpc_apikey_key, sourceOptions.grpc_apikey_value);
      }
      break;

    case 'bearer':
      if (sourceOptions.bearer_token) {
        allMetadata.set('authorization', `Bearer ${sourceOptions.bearer_token}`);
      }
      break;

    case 'basic':
      if (sourceOptions.username && sourceOptions.password) {
        const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
        allMetadata.set('authorization', `Basic ${credentials}`);
      }
      break;

    case 'oauth2':
      // For OAuth2, access_token is in datasource metadata (already added above)
      const sanitizedAuth = sanitizeDatasourceMetadata(sourceOptions);
      if (sanitizedAuth?.access_token) {
        if (sourceOptions.add_token_to === 'header') {
          const prefix = sourceOptions.header_prefix || 'Bearer ';
          allMetadata.set('authorization', `${prefix}${sanitizedAuth.access_token}`);
        } else {
          allMetadata.set('token', sanitizedAuth.access_token);
        }
      }
      break;
  }

  // Return CallCredentials for reliable delivery of ALL metadata (non-TLS connections)
  const metadataMap = allMetadata.getMap();
  const hasMetadata = metadataMap && Object.keys(metadataMap).length > 0;

  if (hasMetadata) {
    return {
      credentials: grpc.credentials.createFromMetadataGenerator((_context, callback) => {
        callback(null, allMetadata);
      })
    };
  }

  return {};
};

/**
 * Prepare CallCredentials for CRITICAL metadata only (datasource + auth)
 * This ensures reliable delivery of metadata required for basic server operation
 * Query-specific metadata should use regular metadata transport
 */
export const prepareCriticalCallCredentials = (
  sourceOptions: SourceOptions
): grpc.CallOptions => {
  const criticalMetadata = new grpc.Metadata();

  // 1. Add datasource metadata (client-id, cp-env, etc.) - CRITICAL for server context
  if (sourceOptions.metadata && sourceOptions.metadata.length > 0) {
    const sanitizedDatasourceMetadata = sanitizeDatasourceMetadata(sourceOptions);

    Object.entries(sanitizedDatasourceMetadata).forEach(([key, value]) => {
      if (key && value) {
        criticalMetadata.set(key, String(value));
      }
    });
  }

  // 2. Add auth metadata based on auth_type - CRITICAL for authentication
  switch (sourceOptions.auth_type) {
    case 'api_key':
      if (sourceOptions.grpc_apikey_key && sourceOptions.grpc_apikey_value) {
        criticalMetadata.set(sourceOptions.grpc_apikey_key, sourceOptions.grpc_apikey_value);
      }
      break;

    case 'bearer':
      if (sourceOptions.bearer_token) {
        criticalMetadata.set('authorization', `Bearer ${sourceOptions.bearer_token}`);
      }
      break;

    case 'basic':
      if (sourceOptions.username && sourceOptions.password) {
        const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
        criticalMetadata.set('authorization', `Basic ${credentials}`);
      }
      break;

    case 'oauth2':
      // For OAuth2, get only the access_token from datasource
      const sanitizedAuth = sanitizeDatasourceMetadata(sourceOptions);
      if (sanitizedAuth?.access_token) {
        if (sourceOptions.add_token_to === 'header') {
          const prefix = sourceOptions.header_prefix || 'Bearer ';
          criticalMetadata.set('authorization', `${prefix}${sanitizedAuth.access_token}`);
        } else {
          criticalMetadata.set('token', sanitizedAuth.access_token);
        }
      }
      break;
  }

  // Return CallCredentials only if we have critical metadata
  const metadataMap = criticalMetadata.getMap();
  const hasCriticalMetadata = metadataMap && Object.keys(metadataMap).length > 0;

  if (hasCriticalMetadata) {
    return {
      credentials: grpc.credentials.createFromMetadataGenerator((_context, callback) => {
        callback(null, criticalMetadata);
      })
    };
  }

  return {};
};

/**
 * Prepare regular metadata for query-specific headers only
 * Uses standard gRPC metadata transport (visible in traces, follows standards)
 * Should be used for optional, query-specific contextual data
 */
export const prepareQueryMetadata = (
  queryOptions?: QueryOptions
): grpc.Metadata => {
  const queryMetadata = new grpc.Metadata();

  if (queryOptions?.metadata && Array.isArray(queryOptions.metadata) && queryOptions.metadata.length > 0) {
    const sanitizedQueryMetadata = sanitizeQueryMetadata(queryOptions);

    Object.entries(sanitizedQueryMetadata).forEach(([key, value]) => {
      if (key && value) {
        queryMetadata.set(key, String(value));
      }
    });
  }

  return queryMetadata;
};

/**
 * Combine datasource metadata with query metadata for TLS connections
 * Since auth is handled at channel level, we can combine all non-auth metadata
 */
export const combineDatasourceAndQueryMetadata = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.Metadata => {
  const combinedMetadata = new grpc.Metadata();

  // 1. Add datasource metadata (client-id, tenant-id, etc.)
  if (sourceOptions.metadata && Array.isArray(sourceOptions.metadata) && sourceOptions.metadata.length > 0) {
    const sanitizedDatasourceMetadata = sanitizeDatasourceMetadata(sourceOptions);

    Object.entries(sanitizedDatasourceMetadata).forEach(([key, value]) => {
      if (key && value) {
        combinedMetadata.set(key, String(value));
      }
    });
  }

  // 2. Add query metadata
  if (queryOptions?.metadata && Array.isArray(queryOptions.metadata) && queryOptions.metadata.length > 0) {
    const sanitizedQueryMetadata = sanitizeQueryMetadata(queryOptions);

    Object.entries(sanitizedQueryMetadata).forEach(([key, value]) => {
      if (key && value) {
        combinedMetadata.set(key, String(value));
      }
    });
  }

  return combinedMetadata;
};

/**
 * Sanitize datasource metadata only (client-id, cp-env, etc.)
 * Used for critical metadata that needs reliable delivery
 */
const sanitizeDatasourceMetadata = (sourceOptions: SourceOptions): { [k: string]: string } => {
  const ensureArrayFormat = (metadata: any) => {
    if (!metadata) return [];
    if (Array.isArray(metadata)) return metadata;
    return [];
  };

  const sourceOptionsWithHeaders = {
    ...sourceOptions,
    headers: ensureArrayFormat(sourceOptions.metadata)
  };

  return sanitizeHeaders(sourceOptionsWithHeaders, {}, true);
};

/**
 * Sanitize query metadata only (request-id, trace-id, etc.)
 * Used for query-specific headers that follow gRPC standards
 */
const sanitizeQueryMetadata = (queryOptions: QueryOptions): { [k: string]: string } => {
  const ensureArrayFormat = (metadata: any) => {
    if (!metadata) return [];
    if (Array.isArray(metadata)) return metadata;
    return [];
  };

  const queryOptionsWithHeaders = {
    ...queryOptions,
    headers: ensureArrayFormat(queryOptions.metadata)
  };

  return sanitizeHeaders({}, queryOptionsWithHeaders, false);
};


export const buildChannelCredentials = (sourceOptions: SourceOptions): grpc.ChannelCredentials => {
  const channelCredentials = createTransportCredentials(sourceOptions);

  // For TLS connections with auth, use secure combineChannelCredentials approach
  if (sourceOptions.ssl_enabled) {
    const authCallOptions = prepareAuthCallOptions(sourceOptions);
    if (authCallOptions.credentials) {
      return grpc.credentials.combineChannelCredentials(
        channelCredentials,
        authCallOptions.credentials
      );
    }
  }

  // For non-TLS connections, return only channel credentials
  // All metadata (auth + datasource + query) will be handled per-call
  return channelCredentials;
};

/**
 * Creates CallCredentials for auth only (no datasource or query metadata)
 * Used for secure TLS channel setup
 */
export const prepareAuthCallOptions = (sourceOptions: SourceOptions): grpc.CallOptions => {
  const authMetadata = new grpc.Metadata();

  switch (sourceOptions.auth_type) {
    case 'api_key':
      if (sourceOptions.grpc_apikey_key && sourceOptions.grpc_apikey_value) {
        authMetadata.set(sourceOptions.grpc_apikey_key, sourceOptions.grpc_apikey_value);
      }
      break;

    case 'bearer':
      if (sourceOptions.bearer_token) {
        authMetadata.set('authorization', `Bearer ${sourceOptions.bearer_token}`);
      }
      break;

    case 'basic':
      if (sourceOptions.username && sourceOptions.password) {
        const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
        authMetadata.set('authorization', `Basic ${credentials}`);
      }
      break;

    case 'oauth2':
      const sanitizedMetadata = sanitizeDatasourceMetadata(sourceOptions);
      if (sanitizedMetadata?.access_token) {
        if (sourceOptions.add_token_to === 'header') {
          const prefix = sourceOptions.header_prefix || 'Bearer ';
          authMetadata.set('authorization', `${prefix}${sanitizedMetadata.access_token}`);
        } else {
          authMetadata.set('token', sanitizedMetadata.access_token);
        }
      }
      break;
  }

  const metadataMap = authMetadata.getMap();
  const hasMetadata = metadataMap && Object.keys(metadataMap).length > 0;

  if (hasMetadata) {
    return {
      credentials: grpc.credentials.createFromMetadataGenerator((_context, callback) => {
        callback(null, authMetadata);
      })
    };
  }

  return {};
};

/**
 * Prepares metadata for TLS connections (datasource + query metadata, no auth)
 * Auth is handled at channel level via combineChannelCredentials
 */
export const prepareMetadataForTLS = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.Metadata => {
  // Use the existing function that combines datasource and query metadata
  return combineDatasourceAndQueryMetadata(sourceOptions, queryOptions);
};

/**
 * Universal gRPC method executor with hybrid metadata approach
 * - Critical metadata (datasource + auth) → CallCredentials (reliable delivery)
 * - Query metadata → Regular metadata (standards-compliant, visible in traces)
 */
export const executeGrpcMethod = async (
  client: GrpcClient,
  methodName: string,
  message: Record<string, unknown>,
  sourceOptions: SourceOptions,
  queryOptions: QueryOptions
): Promise<Record<string, unknown>> => {
  const methodFunction = client[methodName] as UnaryMethodFunction;

  if (typeof methodFunction !== 'function') {
    throw new GrpcOperationError(`Method ${methodName} not found on client`);
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new GrpcOperationError(
        `Request timeout after 2 minutes for method ${methodName}`,
        { errorType: 'NetworkError', grpcStatus: 'DEADLINE_EXCEEDED' }
      ));
    }, 120000);

    const callback = (error: grpc.ServiceError | null, response?: Record<string, unknown>) => {
      clearTimeout(timeout);
      if (error) {
        reject(new GrpcOperationError(`gRPC call failed: ${error.message}`, error));
      } else {
        resolve(response || {});
      }
    };

    if (sourceOptions.ssl_enabled) {
      // TLS connections: Auth at channel level, all other metadata as regular metadata
      const metadata = combineDatasourceAndQueryMetadata(sourceOptions, queryOptions);
      methodFunction.call(client, message, metadata, callback);
    } else {
      // Non-TLS connections: All metadata (auth + datasource + query) via CallCredentials
      const allMetadataOptions = prepareGrpcCallOptions(sourceOptions, queryOptions);
      methodFunction.call(client, message, allMetadataOptions, callback);
    }
  });
};

const createReflectionClient = async (sourceOptions: SourceOptions): Promise<GrpcReflection> => {
  try {
    if (!sourceOptions) {
      throw new GrpcOperationError('Source options are required to create reflection client');
    }

    if (!sourceOptions.url) {
      throw new GrpcOperationError('Server URL is required to create reflection client. Please configure the server URL in your data source settings.');
    }

    const credentials = buildChannelCredentials(sourceOptions);
    const cleanUrl = sanitizeGrpcServerUrl(sourceOptions.url, sourceOptions.ssl_enabled);
    const reflectionClient = new GrpcReflection(cleanUrl, credentials);

    return reflectionClient;
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Failed to create reflection client: ${err.message}`, error);
  }
};

const recursiveServiceSearch = (grpcObject: grpc.GrpcObject, serviceName: string): (new (url: string, credentials: any) => GrpcClient) | null => {
  for (const key in grpcObject) {
    const value = grpcObject[key];
    if (key === serviceName && typeof value === 'function') {
      // Type assertion necessary: grpc.GrpcObject can contain constructor functions
      return value as (new (url: string, credentials: any) => GrpcClient);
    }
    if (isRecord(value)) {
      const found = recursiveServiceSearch(value as grpc.GrpcObject, serviceName);
      if (found) return found;
    }
  }
  return null;
};

const isServiceDefinition = (value: unknown): value is grpc.ServiceDefinition => {
  // After grpc.loadPackageDefinition(), services are constructor functions
  // We just need to check if it's a function (gRPC service constructors)
  return typeof value === 'function';
};

const isNamespace = (value: unknown): boolean => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isServiceDefinition(value) &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
};

const isMethodDefinition = (value: unknown): value is grpc.MethodDefinition<any, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('path' in value || 'originalName' in value) &&
    'requestStream' in value &&
    'responseStream' in value
  );
};
