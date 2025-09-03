import * as grpc from '@grpc/grpc-js';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function hasProperty<T extends PropertyKey>(obj: unknown, prop: T): obj is Record<T, unknown> {
  return isRecord(obj) && prop in obj;
}

export interface GrpcClient {
  [methodName: string]: Function | any;
}

export { toError, isRecord, hasProperty };

export type { ServiceError as GrpcServiceError } from '@grpc/grpc-js/build/src/call';
export { Status as GrpcStatus } from '@grpc/grpc-js/build/src/constants';
export { ReflectionException, ReflectionRequestException } from 'grpc-js-reflection-client/dist/Exceptions';

// Helper type for standardized error details structure
export interface GrpcErrorDetails extends Record<string, unknown> {
  grpcCode: number;
  grpcStatus: string;
  grpcDetails?: string;
  grpcMetadata?: Record<string, any>;
  httpStatus?: number;
  httpStatusText?: string;
  networkCode?: string;
  errorType: 'ServiceError' | 'ReflectionException' | 'ReflectionRequestException' | 'NetworkError' | 'ParseError' | 'QueryError';
}

export type SourceOptions = {
  url: string;
  proto_files: 'server_reflection' | 'import_proto_file';
  proto_file_url?: string;
  auth_type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key';
  username?: string;
  password?: string;
  bearer_token?: string;
  // API Key auth
  grpc_apikey_key?: string;
  grpc_apikey_value?: string;
  // OAuth2 fields
  grant_type?: 'authorization_code' | 'client_credentials';
  add_token_to?: 'header' | 'metadata';
  header_prefix?: string;
  access_token_url?: string;
  client_id?: string;
  client_secret?: string;
  audience?: string;
  scopes?: string;
  auth_url?: string;
  client_auth?: 'header' | 'body';
  custom_auth_params?: Array<[string, string]>;
  // Custom metadata
  metadata?: Array<[string, string]>;
  // SSL/TLS
  ssl_enabled: boolean;
  ssl_certificate?: 'ca_certificate' | 'client_certificate' | 'none';
  ca_cert?: string;
  client_key?: string;
  client_cert?: string;
};

export type QueryOptions = {
  service: string;
  method: string;
  raw_message?: string;
  metadata?: Record<string, string>;
};

export interface GrpcService {
  name: string;
  methods: GrpcMethod[];
}

export interface GrpcMethod {
  name: string;
  requestStreaming: boolean;
  responseStreaming: boolean;
}

export class GrpcOperationError extends Error {
  public readonly errorDetails: GrpcErrorDetails;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'GrpcOperationError';
    this.errorDetails = this.buildErrorDetails(originalError);
  }

  private buildErrorDetails(error: unknown): GrpcErrorDetails {
    const baseDetails: GrpcErrorDetails = {
      grpcCode: 0,
      grpcStatus: 'UNKNOWN',
      errorType: 'QueryError'
    };

    if (this.isGrpcServiceError(error)) {
      baseDetails.grpcCode = error.code;
      baseDetails.grpcStatus = this.getGrpcStatusName(error.code);
      baseDetails.grpcDetails = error.details;
      baseDetails.grpcMetadata = error.metadata?.getMap();
      baseDetails.errorType = 'ServiceError';
    } else if (this.isReflectionException(error)) {
      baseDetails.errorType = 'ReflectionException';
    } else if (this.isReflectionRequestException(error)) {
      baseDetails.errorType = 'ReflectionRequestException';
    } else if (this.isNetworkError(error)) {
      baseDetails.errorType = 'NetworkError';
      if (isRecord(error)) {
        if (hasProperty(error, 'response') && isRecord(error.response)) {
          const response = error.response;
          if (typeof response.statusCode === 'number') {
            baseDetails.httpStatus = response.statusCode;
          } else if (typeof response.status === 'number') {
            baseDetails.httpStatus = response.status;
          }
          if (typeof response.statusMessage === 'string') {
            baseDetails.httpStatusText = response.statusMessage;
          } else if (typeof response.statusText === 'string') {
            baseDetails.httpStatusText = response.statusText;
          }
        }
        if (hasProperty(error, 'code') && typeof error.code === 'string') {
          baseDetails.networkCode = error.code;
        }
      }
    } else if (error && typeof error === 'object' && error.constructor?.name === 'SyntaxError') {
      baseDetails.errorType = 'ParseError';
    }

    return baseDetails;
  }

  private isGrpcServiceError(error: unknown): error is { code: number; message: string; details: string; metadata: any } {
    return (
      isRecord(error) &&
      hasProperty(error, 'code') &&
      hasProperty(error, 'message') &&
      hasProperty(error, 'details') &&
      hasProperty(error, 'metadata') &&
      typeof error.code === 'number'
    );
  }

  private isReflectionException(error: unknown): boolean {
    return error !== null &&
      typeof error === 'object' &&
      error.constructor?.name === 'ReflectionException';
  }

  private isReflectionRequestException(error: unknown): boolean {
    return error !== null &&
      typeof error === 'object' &&
      error.constructor?.name === 'ReflectionRequestException';
  }

  private isNetworkError(error: unknown): error is Record<string, unknown> {
    return error !== null &&
      typeof error === 'object' &&
      ('response' in error || 'code' in error);
  }

  private getGrpcStatusName(code: number): string {
    const statusNames: Record<number, string> = {
      0: 'OK',
      1: 'CANCELLED',
      2: 'UNKNOWN',
      3: 'INVALID_ARGUMENT',
      4: 'DEADLINE_EXCEEDED',
      5: 'NOT_FOUND',
      6: 'ALREADY_EXISTS',
      7: 'PERMISSION_DENIED',
      8: 'RESOURCE_EXHAUSTED',
      9: 'FAILED_PRECONDITION',
      10: 'ABORTED',
      11: 'OUT_OF_RANGE',
      12: 'UNIMPLEMENTED',
      13: 'INTERNAL',
      14: 'UNAVAILABLE',
      15: 'DATA_LOSS',
      16: 'UNAUTHENTICATED'
    };
    return statusNames[code] || `UNKNOWN_STATUS_${code}`;
  }
}

export class GrpcConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GrpcConnectionError';
  }
}


