import { Subject } from 'rxjs';
import { EntityManager } from 'typeorm';

export interface ProcessInfo {
  task: string;
  process: (manager?: EntityManager) => Promise<any>;
  weightage?: number; // percentage, optional
}

export interface ProcessOptions {
  isRunParallel?: boolean; // default false
  isBreakOnError?: boolean; // default true
  userId?: string; // linked to jobId for auth validation
  /**
   * Run all tasks inside a single DB transaction. Each task receives the
   * EntityManager as its first argument; if any task throws, the entire
   * transaction is rolled back.
   *
   * - `true`: start a new transaction internally via dbTransactionWrap
   * - `EntityManager`: reuse the caller's existing transaction
   *
   * Only effective when `isRunParallel === false` and `isBreakOnError === true`.
   */
  manager?: EntityManager | true;
  /**
   * Called when the job is treated as successful — i.e. all tasks succeeded,
   * OR `isBreakOnError` is `false` (failures are tolerated).
   *
   * In transactional mode the shared `EntityManager` is passed and the callback
   * runs inside the transaction as the final step before commit. If it throws,
   * the entire transaction is rolled back.
   */
  onSuccess?: (manager?: EntityManager) => Promise<void> | void;
  /**
   * Called when the job is treated as failed — i.e. at least one task failed
   * AND `isBreakOnError` is `true`. Not invoked when `isBreakOnError` is `false`
   * (use `onSuccess` for that case).
   *
   * In transactional mode the shared `EntityManager` is passed and the callback
   * runs inside the transaction immediately before the forced rollback, so any
   * DB writes it performs are also rolled back.
   */
  onFailure?: (manager?: EntityManager) => Promise<void> | void;
}

export interface ResolvedProcessInfo {
  task: string;
  weightage: number;
}

export interface SseProgressEvent {
  jobId: string;
  task: string;
  weightage: number;
  completedWeightage: number;
  status: 'running' | 'completed' | 'failed' | 'done';
  error?: string;
  result?: any;
}

export interface JobContext {
  subject: Subject<SseProgressEvent>;
  resolvedInfo: ResolvedProcessInfo[];
  userId?: string;
}
