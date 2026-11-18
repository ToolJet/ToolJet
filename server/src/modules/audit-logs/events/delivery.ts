import { AuditEventRecord } from './types';

// How audit events travel from the request to the audit_events table (Enterprise).

export const AUDIT_EVENTS_QUEUE = 'audit-events';

export const AUDIT_EVENTS_PER_JOB = 100;
export const AUDIT_BATCH_ROWS = 500;
export const AUDIT_BATCH_WAIT_MS = 1000;
export const AUDIT_ENQUEUE_TIMEOUT_MS = 300;
export const AUDIT_WORKER_CHECK_MS = 60_000;

export type AuditSinkMode = 'queue' | 'db';

// `db` writes before the response, as tests expect. Everything else queues after the response.
export const auditSinkMode = (): AuditSinkMode => {
  const configured = process.env.AUDIT_SINK;
  if (configured === 'db' || configured === 'queue') return configured;
  return process.env.NODE_ENV === 'test' ? 'db' : 'queue';
};

// A job's payload after JSON round-tripping through Redis: dates arrive as strings.
export type QueuedAuditEvent = Omit<AuditEventRecord, 'created_at'> & { created_at: string | Date };

export interface AuditJobData {
  events: QueuedAuditEvent[];
}

export const reviveAuditEvent = (event: QueuedAuditEvent): AuditEventRecord => ({
  ...event,
  created_at: new Date(event.created_at),
});

export const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

export const withTimeout = <T>(work: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
};
