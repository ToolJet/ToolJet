// Separate plugin from legacy 'openapi' (like grpc/grpcv2).
export const OPENAPI_V2_DATASOURCE_KIND = 'openapiv2';

export const OPENAPI_SPEC_PROCESSING_QUEUE = 'openapi-spec-processing';
export const PROCESS_OPENAPI_SPEC_JOB = 'process-openapi-spec';

// Operations per dereference/insert batch (OPENAPI_SPEC_BATCH_SIZE). Keep rows x columns under
// Postgres's 65,535 bind-parameter limit.
export const DEFAULT_OPENAPI_SPEC_BATCH_SIZE = parseInt(process.env.OPENAPI_SPEC_BATCH_SIZE) || 50;

export enum OpenApiSpecStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum OpenApiSpecSourceType {
  URL = 'url',
  DEFINITION = 'definition',
}

// Worker-managed keys in data_source_options.options for openapiv2 datasources.
export const OPENAPI_SPEC_OPTION_KEYS = {
  SOURCE_TYPE: 'spec_source_type',
  URL: 'spec_url',
  RAW_SPEC: 'raw_spec',
  VERSION: 'spec_version',
  STATUS: 'spec_status',
  ERROR: 'spec_error',
  JOB_ID: 'spec_job_id',
  METADATA: 'spec_metadata',
  CHECKSUM: 'spec_checksum',
} as const;

export enum FEATURE_KEY {
  CREATE = 'CREATE',
  GET_STATUS = 'GET_STATUS',
  CANCEL = 'CANCEL',
  GET_METADATA = 'GET_METADATA',
  LIST_OPERATIONS = 'LIST_OPERATIONS',
  GET_OPERATION = 'GET_OPERATION',
}
