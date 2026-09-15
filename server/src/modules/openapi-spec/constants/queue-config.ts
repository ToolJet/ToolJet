/**
 * OpenAPI spec processing queue concurrency.
 *
 * Controls how many spec-processing jobs a single worker instance runs at once. A large/
 * circular spec's per-batch dereference work is CPU/memory heavy enough that this defaults to
 * 1 (no concurrent jobs) rather than BullMQ's usual multi-job defaults elsewhere in this repo -
 * raise it per-deployment via TOOLJET_OPENAPI_SPEC_CONCURRENCY (e.g. Cloud sets this to 2),
 * mirroring TOOLJET_WORKFLOW_CONCURRENCY's env-driven pattern rather than branching on edition
 * in code.
 */
export const OPENAPI_SPEC_CONCURRENCY = parseInt(process.env.TOOLJET_OPENAPI_SPEC_CONCURRENCY || '1');
