/**
 * Spec-processing jobs per worker (TOOLJET_OPENAPI_SPEC_CONCURRENCY). Defaults to 1 because
 * large specs are CPU/memory heavy.
 */
export const OPENAPI_SPEC_CONCURRENCY = parseInt(process.env.TOOLJET_OPENAPI_SPEC_CONCURRENCY || '1');
