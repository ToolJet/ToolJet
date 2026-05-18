import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { ProcessInfo, ProcessOptions, ResolvedProcessInfo, SseProgressEvent } from './types';
import { Subject } from 'rxjs';
import { TransactionLogger } from '@modules/logging/service';
import { BackgroundProcessorJobStore } from './store';
import { dbTransactionWrap } from '@helpers/database.helper';

/**
 * Background Processor Service
 *
 * A generic service for running multiple asynchronous tasks with progress tracking via SSE.
 * Supports multi-pod deployments via Redis pub/sub.
 *
 * @example
 * ```typescript
 * // 1. Inject the service into your own service/controller:
 * constructor(private readonly backgroundProcessor: BackgroundProcessorUtilService) {}
 *
 * // 2. Define your tasks as ProcessInfo[]:
 * const tasks: ProcessInfo[] = [
 *   {
 *     task: 'Validate input',
 *     process: async () => {
 *       await this.validationService.validate(data);
 *       return { valid: true };
 *     },
 *     weightage: 10, // optional: explicit weight (percentage)
 *   },
 *   {
 *     task: 'Process records',
 *     process: async () => {
 *       const count = await this.recordService.processAll();
 *       return { processed: count };
 *     },
 *     // weightage omitted: will be auto-calculated
 *   },
 *   {
 *     task: 'Send notifications',
 *     process: async () => {
 *       await this.notificationService.sendAll();
 *       return { sent: true };
 *     },
 *   },
 * ];
 *
 * // 3. Start the job:
 * const { jobId, processInfo } = await this.backgroundProcessor.startJob(tasks, {
 *   userId: req.user.id,      // links job to user for SSE auth
 *   isRunParallel: false,      // sequential (default) or parallel
 *   isBreakOnError: true,      // stop on first error (default)
 * });
 *
 * // 4. Return jobId to client, client subscribes to SSE:
 * //    GET /jobs/:jobId/events with JWT auth → receives progress events
 * ```
 *
 * @remarks
 * - Weightages auto-distribute remaining percentage across tasks without explicit weights
 * - SSE events include: 'running', 'completed', 'failed', 'done'
 * - Jobs are automatically cleaned up after completion
 * - Events are distributed via Redis pub/sub for multi-pod support
 */
@Injectable()
export class BackgroundProcessorUtilService {
  constructor(
    private readonly transactionLogger: TransactionLogger,
    private readonly jobStore: BackgroundProcessorJobStore
  ) {}

  /**
   * Starts a background job. Returns immediately with the jobId and
   * resolved weightages, then processes tasks in the background and
   * streams SSE events as each task completes.
   *
   * @param processInfos - Array of tasks to execute. Each task has:
   *   - `task`: Human-readable task name (shown in SSE events)
   *   - `process`: Async function that performs the work and returns a result
   *   - `weightage` (optional): Percentage weight for progress calculation (0-100)
   *
   * @param options - Execution options:
   *   - `userId`: Links job to user for SSE endpoint authorization
   *   - `isRunParallel`: If true, runs all tasks concurrently (default: false)
   *   - `isBreakOnError`: If true, stops execution on first failure (default: true)
   *
   * @returns Promise containing:
   *   - `jobId`: UUID to subscribe to SSE events
   *   - `processInfo`: Resolved task names with calculated weightages
   */
  async startJob(
    processInfos: ProcessInfo[],
    options: ProcessOptions = {}
  ): Promise<{ jobId: string; processInfo: ResolvedProcessInfo[] }> {
    this.transactionLogger.log(`[BackgroundProcessor] startJob invoked with ${processInfos.length} tasks`);

    const { isRunParallel = false, isBreakOnError = true, userId, manager, onSuccess, onFailure } = options;
    const useTransaction = manager !== undefined;

    if (useTransaction) {
      if (isRunParallel) {
        throw new Error(
          '[BackgroundProcessor] manager option requires isRunParallel: false (transactions cannot span parallel tasks)'
        );
      }
      if (!isBreakOnError) {
        throw new Error(
          '[BackgroundProcessor] manager option requires isBreakOnError: true (transactions must abort on first failure)'
        );
      }
    }

    this.transactionLogger.log(
      `[BackgroundProcessor] startJob options - isRunParallel: ${isRunParallel}, isBreakOnError: ${isBreakOnError}, userId: ${userId}, useTransaction: ${useTransaction}`
    );

    const jobId = uuidv4();
    const resolvedInfo = this.resolveWeightages(processInfos);
    this.transactionLogger.log(`[BackgroundProcessor] Weightages resolved for jobId: ${jobId}`);

    // Store job metadata in Redis and get local subject
    const subject = await this.jobStore.set(jobId, { resolvedInfo, userId });
    this.transactionLogger.log(`[BackgroundProcessor] Job ${jobId} registered in Redis store`);

    // fire-and-forget — runs in background
    this.execute(jobId, processInfos, resolvedInfo, subject, {
      isRunParallel,
      isBreakOnError,
      manager,
      onSuccess,
      onFailure,
    }).catch((err) => {
      this.transactionLogger.error(`[BackgroundProcessor] Execute failed for jobId: ${jobId}`, err);
    });

    this.transactionLogger.log(`[BackgroundProcessor] startJob returning jobId: ${jobId}`);
    return { jobId, processInfo: resolvedInfo };
  }

  // ── Weightage resolution ───────────────────────────────────────────────────

  private resolveWeightages(infos: ProcessInfo[]): ResolvedProcessInfo[] {
    this.transactionLogger.log(`[BackgroundProcessor] resolveWeightages invoked with ${infos.length} process infos`);

    let explicitSum = 0;
    let implicitCount = 0;

    for (const info of infos) {
      if (info.weightage != null) {
        if (typeof info.weightage !== 'number' || isNaN(info.weightage)) {
          throw new Error(
            `[BackgroundProcessor] Invalid weightage for task "${info.task}": value is NaN or not a number`
          );
        }
        if (info.weightage < 0) {
          throw new Error(
            `[BackgroundProcessor] Invalid weightage for task "${info.task}": negative value ${info.weightage} is not allowed`
          );
        }
        explicitSum += info.weightage;
      } else {
        implicitCount++;
      }
    }

    // Allow a tiny epsilon for floating-point rounding (e.g. 33.33 * 3 = 99.99)
    if (explicitSum > 100 + 1e-9) {
      throw new Error(
        `[BackgroundProcessor] Invalid weightages: explicit weightages sum to ${explicitSum}, which exceeds 100`
      );
    }

    this.transactionLogger.log(
      `[BackgroundProcessor] resolveWeightages - explicitSum: ${explicitSum}, implicitCount: ${implicitCount}`
    );

    // if nobody provided weightage, equal split
    const implicitWeight = implicitCount > 0 ? (100 - explicitSum) / implicitCount : 0;
    this.transactionLogger.log(`[BackgroundProcessor] resolveWeightages - computed implicitWeight: ${implicitWeight}`);

    const resolved = infos.map((info) => ({
      task: info.task,
      weightage: info.weightage != null ? info.weightage : parseFloat(implicitWeight.toFixed(2)),
    }));

    this.transactionLogger.log(
      `[BackgroundProcessor] resolveWeightages completed - resolved ${resolved.length} weightages`
    );

    return resolved;
  }

  // ── Execution engine ──────────────────────────────────────────────────────

  private async execute(
    jobId: string,
    processInfos: ProcessInfo[],
    resolvedInfo: ResolvedProcessInfo[],
    subject: Subject<SseProgressEvent>,
    options: {
      isRunParallel: boolean;
      isBreakOnError: boolean;
      manager?: EntityManager | true;
      onSuccess?: (manager?: EntityManager) => Promise<void> | void;
      onFailure?: (manager?: EntityManager) => Promise<void> | void;
    }
  ) {
    this.transactionLogger.log(
      `[BackgroundProcessor] execute started for jobId: ${jobId}, tasks: ${processInfos.length}, parallel: ${options.isRunParallel}`
    );

    let completedWeightage = 0;

    const emit = async (event: SseProgressEvent) => {
      this.transactionLogger.log(
        `[BackgroundProcessor] Emitting event for jobId: ${jobId}, task: ${event.task}, status: ${event.status}, completedWeightage: ${event.completedWeightage}`
      );
      // Emit locally for this pod's subscribers
      subject.next(event);
      // Publish to Redis for cross-pod distribution
      await this.jobStore.publishEvent(jobId, event);
    };

    const runTask = async (index: number, taskManager?: EntityManager): Promise<boolean> => {
      const { task, process } = processInfos[index];
      const { weightage } = resolvedInfo[index];

      this.transactionLogger.log(
        `[BackgroundProcessor] runTask started - jobId: ${jobId}, task: "${task}", index: ${index}, weightage: ${weightage}`
      );

      await emit({
        jobId,
        task,
        weightage,
        completedWeightage,
        status: 'running',
      });

      try {
        this.transactionLogger.log(`[BackgroundProcessor] Executing process for task: "${task}", jobId: ${jobId}`);
        const result = await process(taskManager);
        completedWeightage += weightage;

        this.transactionLogger.log(
          `[BackgroundProcessor] Task completed successfully - jobId: ${jobId}, task: "${task}", resultType: ${typeof result}`
        );

        await emit({
          jobId,
          task,
          weightage,
          completedWeightage: parseFloat(completedWeightage.toFixed(2)),
          status: 'completed',
          result,
        });
        return true;
      } catch (err) {
        this.transactionLogger.error(
          `[BackgroundProcessor] Task failed - jobId: ${jobId}, task: "${task}", error: ${err?.message ?? String(err)}`,
          err
        );

        await emit({
          jobId,
          task,
          weightage,
          completedWeightage: parseFloat(completedWeightage.toFixed(2)),
          status: 'failed',
          error: err?.message ?? String(err),
        });
        return false;
      }
    };

    const useTransaction = options.manager !== undefined;
    const { onSuccess, onFailure } = options;

    // Decide between onSuccess and onFailure based on outcome + isBreakOnError.
    // - any failure AND isBreakOnError → onFailure
    // - otherwise (no failures, or isBreakOnError is false) → onSuccess
    const dispatchLifecycle = async (anyFailed: boolean, mgr: EntityManager | undefined): Promise<void> => {
      const treatAsFailure = anyFailed && options.isBreakOnError;
      if (treatAsFailure) {
        if (onFailure) {
          this.transactionLogger.log(`[BackgroundProcessor] Invoking onFailure for jobId: ${jobId}`);
          await onFailure(mgr);
        }
      } else {
        if (onSuccess) {
          this.transactionLogger.log(`[BackgroundProcessor] Invoking onSuccess for jobId: ${jobId}`);
          await onSuccess(mgr);
        }
      }
    };

    try {
      if (options.isRunParallel) {
        // ── Parallel execution ────────────────────────────────────────────
        this.transactionLogger.log(
          `[BackgroundProcessor] Starting parallel execution for jobId: ${jobId}, tasks: ${processInfos.length}`
        );

        const results = await Promise.allSettled(processInfos.map((_, i) => runTask(i)));

        const successCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
        const failCount = results.filter((r) => r.status === 'fulfilled' && r.value === false).length;
        const rejectedCount = results.filter((r) => r.status === 'rejected').length;

        this.transactionLogger.log(
          `[BackgroundProcessor] Parallel execution completed for jobId: ${jobId} - success: ${successCount}, failed: ${failCount}, rejected: ${rejectedCount}`
        );

        const anyFailed = results.some(
          (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === false)
        );

        if (anyFailed && options.isBreakOnError) {
          this.transactionLogger.warn(
            `[BackgroundProcessor] Some tasks failed in parallel execution for jobId: ${jobId}`
          );
          // already emitted individual failures; just finish
        }

        await dispatchLifecycle(anyFailed, undefined);
      } else if (useTransaction) {
        // ── Sequential + transactional execution ─────────────────────────
        // All tasks share a single EntityManager. If any task fails, the
        // whole transaction is rolled back. The failed event has already been
        // emitted by runTask; we throw here so dbTransactionWrap rolls back.
        // onSuccess runs inside the transaction as the final pre-commit step.
        // onFailure runs inside the transaction just before the forced rollback.
        this.transactionLogger.log(
          `[BackgroundProcessor] Starting transactional sequential execution for jobId: ${jobId}, tasks: ${processInfos.length}`
        );

        const callerManager = options.manager === true ? undefined : options.manager;

        await dbTransactionWrap(async (txnManager: EntityManager) => {
          let txnFailed = false;
          let failedAt = -1;

          for (let i = 0; i < processInfos.length; i++) {
            this.transactionLogger.log(
              `[BackgroundProcessor] Transactional task ${i + 1}/${processInfos.length} starting for jobId: ${jobId}`
            );

            const success = await runTask(i, txnManager);

            if (!success) {
              txnFailed = true;
              failedAt = i;
              break;
            }
          }

          if (txnFailed) {
            this.transactionLogger.warn(
              `[BackgroundProcessor] Transactional execution stopped due to failure at task ${failedAt + 1} for jobId: ${jobId} — rolling back`
            );
            await dispatchLifecycle(true, txnManager);
            throw new Error(
              `[BackgroundProcessor] Task "${processInfos[failedAt].task}" failed — rolling back transaction`
            );
          }

          await dispatchLifecycle(false, txnManager);
        }, callerManager);

        this.transactionLogger.log(
          `[BackgroundProcessor] Transactional sequential execution completed for jobId: ${jobId}`
        );
      } else {
        // ── Sequential execution ──────────────────────────────────────────
        this.transactionLogger.log(
          `[BackgroundProcessor] Starting sequential execution for jobId: ${jobId}, tasks: ${processInfos.length}`
        );

        let anyFailed = false;
        for (let i = 0; i < processInfos.length; i++) {
          this.transactionLogger.log(
            `[BackgroundProcessor] Sequential task ${i + 1}/${processInfos.length} starting for jobId: ${jobId}`
          );

          const success = await runTask(i);

          if (!success) {
            anyFailed = true;
            if (options.isBreakOnError) {
              this.transactionLogger.warn(
                `[BackgroundProcessor] Sequential execution stopped due to failure at task ${i + 1} for jobId: ${jobId}`
              );
              break;
            }
          }
        }

        this.transactionLogger.log(`[BackgroundProcessor] Sequential execution completed for jobId: ${jobId}`);

        await dispatchLifecycle(anyFailed, undefined);
      }
    } catch (err) {
      this.transactionLogger.error(`[BackgroundProcessor] Unexpected error during execution for jobId: ${jobId}`, err);
    } finally {
      this.transactionLogger.log(
        `[BackgroundProcessor] Finalizing job: ${jobId}, final completedWeightage: ${completedWeightage}`
      );

      // final "done" envelope
      await emit({
        jobId,
        task: '',
        weightage: 0,
        completedWeightage: parseFloat(completedWeightage.toFixed(2)),
        status: 'done',
      });

      // Cleanup: delete() handles subject.complete(), localSubjects cleanup, and Redis cleanup
      await this.jobStore.delete(jobId);

      this.transactionLogger.log(`[BackgroundProcessor] Job ${jobId} completed and removed from Redis`);
    }
  }
}
