import { JobSchedulerTemplateOptions } from "bullmq";

// Job priority levels (lower numbers = higher priority)
export const WORKFLOW_PRIORITY = {
  HIGH: 0,      // Manual/webhook executions (immediate processing)
  SCHEDULED: 1, // Scheduled executions (lower priority)
} as const;

// Job retry and retention configuration
const JOB_CONFIG: JobSchedulerTemplateOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 }, // 2s, 4s, 8s
  removeOnComplete: 100,
  removeOnFail: 50,
} as const;

// Job options for different queue types
export const WORKFLOW_EXECUTION_JOB_OPTIONS = JOB_CONFIG;

export const WORKFLOW_SCHEDULED_EXECUTION_JOB_OPTIONS = {
  priority: WORKFLOW_PRIORITY.SCHEDULED,
  ...JOB_CONFIG,
};

export const WORKFLOW_SCHEDULE_JOB_OPTIONS = {
  priority: WORKFLOW_PRIORITY.HIGH,
  ...JOB_CONFIG
}

const getTimeoutSeconds = () => parseInt(process.env.WORKFLOW_TIMEOUT_SECONDS || '60');

export const WORKFLOW_TIMEOUT = {
  DEFAULT_SECONDS: 60,
  getTimeoutMs: () => getTimeoutSeconds() * 1000,
  getTimeoutSeconds,
} as const;
