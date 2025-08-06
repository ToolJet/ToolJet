import { SourceOptions, QueryOptions, GrpcService, GrpcMethod, GrpcClient, GrpcOperationError, toError, isRecord } from './types';
import got from 'got';
import { GrpcReflection, serviceHelper } from 'grpc-js-reflection-client';
import type { ListMethodsType } from 'grpc-js-reflection-client/dist/Types/ListMethodsType';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';


export const buildReflectionClient = async (sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> => {
  try {
    const credentials = createGrpcCredentials(sourceOptions);
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

    const credentials = createGrpcCredentials(sourceOptions);
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

export const createGrpcCredentials = (sourceOptions: SourceOptions): grpc.ChannelCredentials => {
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
    const serviceNames: string[] = await reflectionClient.listServices();

    if (!serviceNames || serviceNames.length === 0) {
      throw new GrpcOperationError('No services found via reflection');
    }

    const services: GrpcService[] = [];

    for (const serviceName of serviceNames) {
      try {
        const methods: ListMethodsType[] = await reflectionClient.listMethods(serviceName);

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
    if (!isRecord(serviceDefinition)) {
      return methods;
    }
    const serviceObj = serviceDefinition.service;

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

export const parseRequestData = (queryOptions: QueryOptions): void => {
  if (!queryOptions.request) {
    queryOptions.request = {};
    return;
  }

  if (typeof queryOptions.request === 'string') {
    try {
      if (typeof queryOptions.request === 'string') {
        queryOptions.request = JSON5.parse(queryOptions.request);
      }
    } catch (error) {
      const err = toError(error);
      throw new GrpcOperationError(`Invalid JSON in request data: ${err.message}`, error);
    }
  }
};

export const buildGrpcMetadata = (sourceOptions: SourceOptions, queryMetadata?: Record<string, string>): grpc.Metadata => {
  const metadata = new grpc.Metadata();

  switch (sourceOptions.auth_type) {
    case 'basic':
      if (sourceOptions.username && sourceOptions.password) {
        const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
        metadata.add('authorization', `Basic ${credentials}`);
      }
      break;

    case 'bearer':
      if (sourceOptions.bearer_token) {
        metadata.add('authorization', `Bearer ${sourceOptions.bearer_token}`);
      }
      break;

    case 'oauth2':
      if (queryMetadata?.access_token) {
        if (sourceOptions.add_token_to === 'header') {
          const prefix = sourceOptions.header_prefix || 'Bearer ';
          metadata.add('authorization', `${prefix}${queryMetadata.access_token}`);
        } else {
          metadata.add('token', queryMetadata.access_token);
        }
      }
      break;
  }

  if (sourceOptions.metadata) {
    sourceOptions.metadata.forEach(([key, value]) => {
      if (key && value) {
        metadata.add(key.toLowerCase(), value);
      }
    });
  }

  if (queryMetadata) {
    Object.entries(queryMetadata).forEach(([key, value]) => {
      if (key && value && key !== 'access_token') {
        metadata.add(key.toLowerCase(), value);
      }
    });
  }

  return metadata;
};

const createReflectionClient = async (sourceOptions: SourceOptions): Promise<GrpcReflection> => {
  try {
    if (!sourceOptions) {
      throw new GrpcOperationError('Source options are required to create reflection client');
    }

    if (!sourceOptions.url) {
      throw new GrpcOperationError('Server URL is required to create reflection client. Please configure the server URL in your data source settings.');
    }

    const credentials = createGrpcCredentials(sourceOptions);
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
  if (typeof value !== 'function' || value === null) {
    return false;
  }
  return isRecord(value) && isRecord(value.service);
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