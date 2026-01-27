/**
 * Centralized BullMQ Queue Configuration
 *
 * This file contains all queue-related configurations for workflow execution and scheduling.
 * Centralizing these values makes it easier to reason about and maintain queue behavior.
 */

/**
 * Priority levels for workflow execution jobs
 * Lower numbers = higher priority
 *
 * MANUAL/WEBHOOK: Priority 0 (highest) - User-triggered executions get immediate attention
 * SCHEDULED: Priority 1 - Scheduled workflows run with slightly lower priority
 */
export const WORKFLOW_PRIORITY = {
  MANUAL: 0,    // Manual workflow executions from UI
  WEBHOOK: 0,   // Webhook-triggered workflow executions
  SCHEDULED: 1, // Scheduled workflow executions
};

/**
 * Retry configuration for failed workflow jobs
 *
 * attempts: Number of times to retry a failed job
 * backoff: Exponential backoff with 2 second initial delay
 *   - 1st retry: 2 seconds
 *   - 2nd retry: 4 seconds
 *   - 3rd retry: 8 seconds
 */
export const WORKFLOW_JOB_RETRY_CONFIG = {
  attempts: 0, // No retries by default; adjust as needed
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // 2 seconds initial delay
  },
};

/**
 * Job retention policy
 *
 * removeOnComplete: Keep last N completed jobs for debugging/auditing
 * removeOnFail: Keep last N failed jobs for debugging/troubleshooting
 */
export const WORKFLOW_QUEUE_RETENTION = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
};

/**
 * Combined job options for manual/webhook workflow executions
 */
export const WORKFLOW_EXECUTION_JOB_OPTIONS = {
  ...WORKFLOW_JOB_RETRY_CONFIG,
  ...WORKFLOW_QUEUE_RETENTION,
};

/**
 * Combined job options for scheduled workflow executions
 * Includes lower priority than manual/webhook executions
 */
export const WORKFLOW_SCHEDULED_EXECUTION_JOB_OPTIONS = {
  priority: WORKFLOW_PRIORITY.SCHEDULED,
  ...WORKFLOW_JOB_RETRY_CONFIG,
  ...WORKFLOW_QUEUE_RETENTION,
};

/**
 * Workflow execution timeout configuration
 *
 * DEFAULT_SECONDS: Default timeout if WORKFLOW_TIMEOUT_SECONDS env var is not set
 * getTimeoutMs: Get timeout in milliseconds (from env var or default)
 * getTimeoutSeconds: Get timeout in seconds (from env var or default)
 */
export const WORKFLOW_TIMEOUT = {
  DEFAULT_SECONDS: 60,
  getTimeoutMs: () => parseInt(process.env.WORKFLOW_TIMEOUT_SECONDS || '60') * 1000,
  getTimeoutSeconds: () => parseInt(process.env.WORKFLOW_TIMEOUT_SECONDS || '60'),
};

/**
 * Workflow processor concurrency configuration
 *
 * Controls the maximum number of workflow jobs that can be processed concurrently
 * by each worker instance. Higher values allow more parallel processing but consume
 * more resources (CPU, memory, database connections).
 *
 * DEFAULT: 5 concurrent jobs per worker
 * Configurable via TOOLJET_WORKFLOW_CONCURRENCY environment variable
 */
export const WORKFLOW_CONCURRENCY = parseInt(process.env.TOOLJET_WORKFLOW_CONCURRENCY || '5');
