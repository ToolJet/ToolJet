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

/**
 * Job lock duration / stalled-check interval for the openapi-spec queue.
 *
 * BullMQ renews a job's lock on a timer (half of lockDuration) while it's processing, and
 * separately runs a stalled-check every stalledInterval that reclaims any job whose lock has
 * expired in Redis - after maxStalledCount (default 1) such reclaims, the job is permanently
 * failed with `UnrecoverableError: job stalled more than allowable limit`. This processor's
 * per-batch dereference/prune work on a large spec (e.g. Microsoft Graph, 17k+ operations) is
 * synchronous CPU work heavy enough to occasionally starve the event loop past BullMQ's default
 * 30s lockDuration, which reads as "the worker died" even though it's still actively working -
 * failing a job that would otherwise have completed. Raised to 5 minutes for both settings so a
 * slow batch has real headroom to renew its lock before either it expires or the next stalled
 * sweep runs.
 */
export const OPENAPI_SPEC_STALLED_CHECK_INTERVAL_MS = parseInt(
  process.env.TOOLJET_OPENAPI_SPEC_STALLED_CHECK_INTERVAL_MS || `${5 * 60 * 1000}`
);
