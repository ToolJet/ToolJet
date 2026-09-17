// The new plugin's own kind, mirroring how grpc/grpcv2 coexist as distinct plugin kinds -
// this is a separate connector from the legacy 'openapi' plugin, not a version flag on it.
export const OPENAPI_V2_DATASOURCE_KIND = 'openapiv2';

export const OPENAPI_SPEC_PROCESSING_QUEUE = 'openapi-spec-processing';
export const PROCESS_OPENAPI_SPEC_JOB = 'process-openapi-spec';

// Governs both the per-batch dereference step and the persistence batch size (same number, not
// two separate configs) - keeps peak per-step work/memory bounded to one batch's worth of
// operations rather than the whole spec's, and keeps each persistence batch's bound-parameter
// count safely under Postgres's 65,535-per-query limit.
export const DEFAULT_OPENAPI_SPEC_BATCH_SIZE = parseInt(process.env.OPENAPI_SPEC_BATCH_SIZE) || 50;

// Ceiling on the single transaction spanning the whole job (clear + dereference + persist every
// batch for every environment) - checked once per batch, same synchronization point as the
// termination/memory checks, since there's no way to abort a transaction mid-query without
// racing the connection itself. Guards against a transaction (and the row locks/replication slot
// it holds open) running unbounded on a pathologically large spec.
export const OPENAPI_SPEC_JOB_TRANSACTION_TIMEOUT_MS =
  parseInt(process.env.OPENAPI_SPEC_JOB_TRANSACTION_TIMEOUT_MS) || 5 * 60 * 1000;

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

// Keys written into data_source_options.options for kind === 'openapi' (v2) datasources.
// These are worker-managed bookkeeping - never user-editable, never read by a query run
// (see RUNTIME_EXCLUDED_OPTION_KEYS in @modules/data-sources/constants).
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
