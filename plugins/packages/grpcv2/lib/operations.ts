import { SourceOptions, QueryOptions, GrpcService, GrpcMethod, GrpcClient, GrpcOperationError, toError, isRecord } from './types';
import got from 'got';
import { GrpcReflection, serviceHelper, ServiceHelperOptionsType } from 'grpc-js-reflection-client';
import type { ListMethodsType } from 'grpc-js-reflection-client/dist/Types/ListMethodsType';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import { isEmpty } from 'lodash';

const expandPath = (inputPath: string): string => {
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  } else if (inputPath === '~') {
    return os.homedir();
  }
  return path.resolve(inputPath);
};

const getDefaultProtoDirectory = (): string => {
  return path.join(os.homedir(), 'protos');
};

const validateFilesystemAccess = (directory: string): string => {
  // Expand ~ to home directory if needed
  const expandedDir = expandPath(directory);

  if (!fs.existsSync(expandedDir)) {
    throw new GrpcOperationError(`Directory does not exist: ${expandedDir}`);
  }

  const stat = fs.statSync(expandedDir);
  if (!stat.isDirectory()) {
    throw new GrpcOperationError(`Path is not a directory: ${expandedDir}`);
  }

  // Basic security check - prevent path traversal
  const resolvedPath = path.resolve(expandedDir);
  if (!resolvedPath.startsWith(process.cwd()) && !resolvedPath.startsWith(os.homedir())) {
    console.warn(`Directory outside project root or home directory: ${resolvedPath}`);
  }

  return expandedDir;
};

export const buildReflectionClient = async (sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> => {
  try {
    const reflectionClient = await createReflectionClient(sourceOptions);
    const callOptions = buildCallOptionsForStreaming(sourceOptions);

    // list all available services to verify the service exists
    const serviceNames: string[] = await reflectionClient.listServices('*', callOptions);

    if (!serviceNames || serviceNames.length === 0) {
      throw new GrpcOperationError('No services found via reflection');
    }

    if (!serviceNames.includes(serviceName)) {
      throw new GrpcOperationError(`Service ${serviceName} not found. Available services: ${serviceNames.join(', ')}`);
    }

    const methods: ListMethodsType[] = await reflectionClient.listMethods(serviceName, callOptions);

    if (!methods || methods.length === 0) {
      throw new GrpcOperationError(`Service ${serviceName} has no methods`);
    }

    const descriptor = await reflectionClient.getDescriptorBySymbol(serviceName, callOptions);

    if (!descriptor) {
      throw new GrpcOperationError(`Service descriptor not found for ${serviceName}`);
    }

    const packageObject = descriptor.getPackageObject({
      keepCase: true,
      enums: String,
      longs: String,
      defaults: true,
      oneofs: true
    });

    const service = findServiceInPackage(packageObject, serviceName);
    if (!service) {
      throw new GrpcOperationError(`Service ${serviceName} not found in proto descriptor`);
    }

    if (typeof service !== 'function') {
      throw new GrpcOperationError(`Service ${serviceName} is not a valid constructor function`);
    }

    const credentials = buildChannelCredentials(sourceOptions);
    const cleanUrl = sanitizeGrpcServerUrl(sourceOptions.url, sourceOptions.ssl_enabled);
    const ServiceConstructor = service as new (url: string, credentials: any) => GrpcClient;
    const grpcClient = new ServiceConstructor(cleanUrl, credentials);

    return grpcClient;
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

export const buildFilesystemClient = async (sourceOptions: SourceOptions, serviceName: string): Promise<GrpcClient> => {
  try {
    const directory =
      isEmpty(sourceOptions.proto_files_directory) ?
        getDefaultProtoDirectory() :
        sourceOptions.proto_files_directory;

    const protoFilePattern =
      isEmpty(sourceOptions.proto_files_pattern) ?
        '**/*.proto' :
        sourceOptions.proto_files_pattern;

    let packageDefinition: protoLoader.PackageDefinition;

    // Try to use the mapping from last discovery to load only the specific file
    const protoFile = lastServiceToFileMap.get(serviceName);

    if (protoFile && fs.existsSync(protoFile)) {
      // Load only the specific file containing this service
      console.log(`[gRPC] Loading specific proto file for service '${serviceName}': ${path.basename(protoFile)}`);

      const expandedDir = validateFilesystemAccess(directory);

      // Build include directories: root + all parent directories from file to root
      const fileDir = path.dirname(protoFile);
      const includeDirs = [expandedDir];
      let currentDir = fileDir;
      while (currentDir.startsWith(expandedDir) && currentDir !== expandedDir) {
        if (!includeDirs.includes(currentDir)) {
          includeDirs.push(currentDir);
        }
        currentDir = path.dirname(currentDir);
      }

      packageDefinition = await protoLoader.load([protoFile], {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs
      });
    } else {
      // Fallback: Re-discover to find which file contains this service
      console.warn(`[gRPC] Service mapping not found for '${serviceName}', re-discovering proto files...`);

      const { serviceToFileMap } = await discoverServicesIndividually(directory, protoFilePattern);
      const targetFile = serviceToFileMap.get(serviceName);

      if (!targetFile) {
        throw new GrpcOperationError(`Service ${serviceName} not found in any proto file`);
      }

      console.log(`[gRPC] Found service '${serviceName}' in file: ${path.basename(targetFile)}`);

      const expandedDir = validateFilesystemAccess(directory);

      // Build include directories: root + all parent directories from file to root
      const fileDir = path.dirname(targetFile);
      const includeDirs = [expandedDir];
      let currentDir = fileDir;
      while (currentDir.startsWith(expandedDir) && currentDir !== expandedDir) {
        if (!includeDirs.includes(currentDir)) {
          includeDirs.push(currentDir);
        }
        currentDir = path.dirname(currentDir);
      }

      packageDefinition = await protoLoader.load([targetFile], {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs
      });
    }

    const grpcObject = grpc.loadPackageDefinition(packageDefinition);

    const service = findServiceInPackage(grpcObject, serviceName);
    if (!service) {
      throw new GrpcOperationError(`Service ${serviceName} not found in proto files`);
    }

    const credentials = buildChannelCredentials(sourceOptions);
    const cleanUrl = sanitizeGrpcServerUrl(sourceOptions.url, sourceOptions.ssl_enabled);

    if (typeof service !== 'function') {
      throw new GrpcOperationError(`Service ${serviceName} is not a valid constructor function`);
    }

    const ServiceConstructor = service as new (url: string, credentials: any) => GrpcClient;
    const client = new ServiceConstructor(cleanUrl, credentials);
    return client;
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Failed to create filesystem client for service ${serviceName}: ${err.message}`, error);
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
    const callOptions = buildCallOptionsForStreaming(sourceOptions);
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

export const discoverServicesUsingProtoUrl = async (sourceOptions: SourceOptions): Promise<GrpcService[]> => {
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
    throw new GrpcOperationError(`Service discovery via proto URL failed: ${err.message}`, error);
  }
};

// Module-level storage for service-to-file mapping (not cached with TTL, just per-discovery)
let lastServiceToFileMap = new Map<string, string>();

/**
 * Discovers services by loading proto files individually.
 * This prevents duplicate symbol errors and syntax errors in one file from breaking all files.
 */
export const discoverServicesIndividually = async (
  directory: string,
  pattern: string
): Promise<{ services: GrpcService[]; failures: Array<{ file: string; error: string }>; serviceToFileMap: Map<string, string> }> => {
  const expandedDir = validateFilesystemAccess(directory);

  const protoFiles = await fg(pattern, {
    cwd: expandedDir,
    onlyFiles: true,
    absolute: true
  });

  if (protoFiles.length === 0) {
    throw new GrpcOperationError(
      `No .proto files found in directory: ${expandedDir} with pattern: ${pattern}`
    );
  }

  const allServices: GrpcService[] = [];
  const failures: Array<{ file: string; error: string }> = [];
  const serviceToFileMap = new Map<string, string>();

  // Load each file individually to avoid conflicts
  for (const protoFile of protoFiles) {
    try {
      // Build include directories: root + all parent directories from file to root
      const fileDir = path.dirname(protoFile);
      const includeDirs = [expandedDir];

      // Add all parent directories between file and root
      let currentDir = fileDir;
      while (currentDir.startsWith(expandedDir) && currentDir !== expandedDir) {
        if (!includeDirs.includes(currentDir)) {
          includeDirs.push(currentDir);
        }
        currentDir = path.dirname(currentDir);
      }

      // Load THIS file only (not all files together)
      const packageDefinition = await protoLoader.load(
        [protoFile], // Single file array
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
          includeDirs // For resolving imports from root, intermediate dirs, and file's directory
        }
      );

      const grpcObject = grpc.loadPackageDefinition(packageDefinition);
      const services = extractServicesFromGrpcPackage(grpcObject);

      // Track which file contains which service
      services.forEach(service => {
        serviceToFileMap.set(service.name, protoFile);
      });

      allServices.push(...services);

    } catch (error: unknown) {
      // Don't throw - just collect failures for summary logging
      const err = toError(error);
      const fileName = path.basename(protoFile);

      // Skip logging "No services found" errors - these are expected for message-only files
      if (!err.message.includes('No services found')) {
        failures.push({
          file: fileName,
          error: err.message
        });
      }
    }
  }

  // Store mapping for use in buildFilesystemClient
  lastServiceToFileMap = serviceToFileMap;

  return { services: allServices, failures, serviceToFileMap };
};

export const discoverServicesUsingFilesystem = async (sourceOptions: SourceOptions): Promise<GrpcService[]> => {
  try {
    const directory =
      isEmpty(sourceOptions.proto_files_directory) ?
        getDefaultProtoDirectory() :
        sourceOptions.proto_files_directory;

    const protoFilePattern =
      isEmpty(sourceOptions.proto_files_pattern) ?
        '**/*.proto' :
        sourceOptions.proto_files_pattern;

    const { services, failures } = await discoverServicesIndividually(directory, protoFilePattern);

    // Log warnings about skipped files but don't fail
    if (failures.length > 0) {
      console.warn(
        `[gRPC] Successfully discovered ${services.length} service(s) from ${services.length} proto file(s). ` +
        `Skipped ${failures.length} file(s) due to errors:`
      );
      failures.forEach(failure => {
        console.warn(`[gRPC]   - ${failure.file}: ${failure.error}`);
      });
    } else {
      console.log(`[gRPC] Successfully discovered ${services.length} service(s) from proto files.`);
    }

    return services;
  } catch (error: unknown) {
    if (error instanceof GrpcOperationError) {
      throw error;
    }
    const err = toError(error);
    throw new GrpcOperationError(`Service discovery via filesystem failed: ${err.message}`, error);
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
 * Build all metadata (auth, datasource, query) for NON-TLS connections
 * Returns Metadata object directly for use with unary gRPC method calls
 * Note: For non-TLS connections, auth must be included as metadata headers
 */
export const buildMetadataForNonTlsConnection = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.Metadata => {
  const metadata = new grpc.Metadata();

  // 1. Add datasource metadata (client-id, cp-env, etc.)
  if (sourceOptions.metadata && Array.isArray(sourceOptions.metadata) && sourceOptions.metadata.length > 0) {
    const sanitizedDatasourceMetadata = extractSanitizedMetadata(sourceOptions.metadata);
    Object.entries(sanitizedDatasourceMetadata).forEach(([key, value]) => {
      metadata.set(key, value);
    });
  }

  // 2. Add query metadata
  if (queryOptions?.metadata && Array.isArray(queryOptions.metadata) && queryOptions.metadata.length > 0) {
    const sanitizedQueryMetadata = extractSanitizedMetadata(queryOptions.metadata);
    Object.entries(sanitizedQueryMetadata).forEach(([key, value]) => {
      metadata.set(key, value);
    });
  }

  // 3. Add auth metadata based on auth_type (using raw sourceOptions values)
  switch (sourceOptions.auth_type) {
    case 'api_key':
      if (sourceOptions.grpc_apikey_key && sourceOptions.grpc_apikey_value) {
        metadata.set(sourceOptions.grpc_apikey_key, sourceOptions.grpc_apikey_value);
      }
      break;

    case 'bearer':
      if (sourceOptions.bearer_token) {
        metadata.set('authorization', `Bearer ${sourceOptions.bearer_token}`);
      }
      break;

    case 'basic':
      if (sourceOptions.username && sourceOptions.password) {
        const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
        metadata.set('authorization', `Basic ${credentials}`);
      }
      break;

    case 'oauth2':
      // For OAuth2, access_token is in datasource metadata (already added above)
      const sanitizedAuth = extractSanitizedMetadata(sourceOptions.metadata || []);
      if (sanitizedAuth?.access_token) {
        if (sourceOptions.add_token_to === 'header') {
          const prefix = sourceOptions.header_prefix || 'Bearer ';
          metadata.set('authorization', `${prefix}${sanitizedAuth.access_token}`);
        } else {
          metadata.set('token', sanitizedAuth.access_token);
        }
      }
      break;
  }

  // Return the metadata directly for use with unary methods
  return metadata;
};

/**
 * Prepare gRPC call options for STREAMING methods (like reflection)
 * Handles ALL metadata via CallCredentials for non-TLS streaming connections
 * Note: Streaming methods need CallOptions, not Metadata as first parameter
 */
export const buildCallOptionsForStreaming = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.CallOptions => {
  const metadata = buildMetadataForNonTlsConnection(sourceOptions, queryOptions);

  // For streaming methods, wrap metadata in CallCredentials
  const metadataMap = metadata.getMap();
  const hasMetadata = metadataMap && Object.keys(metadataMap).length > 0;

  if (hasMetadata) {
    return {
      credentials: grpc.credentials.createFromMetadataGenerator((_context, callback) => {
        callback(null, metadata);
      })
    };
  }

  return {};
};

/**
 * Build metadata for TLS connections (datasource + query metadata only)
 * Combine datasource metadata with query metadata for TLS connections
 * Since auth is handled at channel level, we can combine all non-auth metadata
 */
export const buildMetadataForTlsConnection = (
  sourceOptions: SourceOptions,
  queryOptions?: QueryOptions
): grpc.Metadata => {
  const combinedMetadata = new grpc.Metadata();

  // 1. Add datasource metadata (client-id, tenant-id, etc.)
  if (sourceOptions.metadata && Array.isArray(sourceOptions.metadata) && sourceOptions.metadata.length > 0) {
    const sanitizedDatasourceMetadata = extractSanitizedMetadata(sourceOptions.metadata);

    Object.entries(sanitizedDatasourceMetadata).forEach(([key, value]) => {
      combinedMetadata.set(key, value);
    });
  }

  // 2. Add query metadata
  if (queryOptions?.metadata && Array.isArray(queryOptions.metadata) && queryOptions.metadata.length > 0) {
    const sanitizedQueryMetadata = extractSanitizedMetadata(queryOptions.metadata);

    Object.entries(sanitizedQueryMetadata).forEach(([key, value]) => {
      combinedMetadata.set(key, value);
    });
  }

  return combinedMetadata;
};

/**
 * Extract and sanitize metadata from a metadata array
 * Returns sanitized metadata as key-value pairs
 */
const extractSanitizedMetadata = (metadata: unknown): { [k: string]: string } => {
  type MetadataEntry = [string, string];

  const cleanMetadata = (metadata: [string, unknown][]): [string, unknown][] =>
    metadata.filter(([k, _]) => k !== '').map(([k, v]) => [k.trim(), v]);

  const filterValidMetadataEntries = (metadata: [string, unknown][]): MetadataEntry[] => {
    return metadata.filter((entry): entry is MetadataEntry => {
      const [_, value] = entry;
      if (value == null) return false;
      if (typeof value === 'string') return true;
      // Convert array to string by joining
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        entry[1] = value.join(', ');
        return true;
      }
      return false;
    });
  };

  const processMetadata = (rawMetadata: [string, unknown][]): { [k: string]: string } => {
    const cleaned = cleanMetadata(rawMetadata || []);
    const validMetadata = filterValidMetadataEntries(cleaned);
    return Object.fromEntries(validMetadata);
  };

  const ensureArrayFormat = (data: unknown): [string, unknown][] => {
    if (!data) return [];
    if (Array.isArray(data)) {
      // Ensure each item is a tuple with at least 2 elements
      return data.filter(item => Array.isArray(item) && item.length >= 2)
        .map(item => [String(item[0]), item[1]]);
    }
    return [];
  };

  return processMetadata(ensureArrayFormat(metadata));
};


export const buildChannelCredentials = (sourceOptions: SourceOptions): grpc.ChannelCredentials => {
  const channelCredentials = createTransportCredentials(sourceOptions);

  // For TLS connections with auth, use secure combineChannelCredentials approach
  if (sourceOptions.ssl_enabled) {
    const authCallOptions = buildAuthCallCredentials(sourceOptions);
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
export const buildAuthCallCredentials = (sourceOptions: SourceOptions): grpc.CallOptions => {
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
      const sanitizedMetadata = extractSanitizedMetadata(sourceOptions.metadata || []);
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
 * Universal gRPC method executor
 * - TLS connections: All metadata as regular metadata (auth handled at channel level)
 * - Non-TLS connections: All metadata via CallCredentials (guaranteed delivery)
 */
export const executeGrpcMethod = async (
  client: GrpcClient,
  methodName: string,
  message: Record<string, unknown>,
  sourceOptions: SourceOptions,
  queryOptions: QueryOptions
): Promise<Record<string, unknown>> => {
  const methodFunction = client[methodName] as unknown;

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
      const metadata = buildMetadataForTlsConnection(sourceOptions, queryOptions);
      methodFunction.call(client, message, metadata, callback);
    } else {
      // Non-TLS connections: All metadata (auth + datasource + query) as direct metadata
      const metadata = buildMetadataForNonTlsConnection(sourceOptions, queryOptions);
      methodFunction.call(client, message, metadata, callback);
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
