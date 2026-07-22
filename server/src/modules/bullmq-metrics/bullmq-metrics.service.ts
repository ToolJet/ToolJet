import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// All BullMQ queues in the platform. Queue depth/worker counts live in Redis,
// so a read-only handle works on any pod regardless of which registers a processor.
const QUEUE_NAMES = ['git-sync-queue', 'app-history', 'workflow-execution-queue', 'workflow-schedule-queue'];
const JOB_STATES = ['waiting', 'active', 'delayed', 'completed', 'failed', 'paused'] as const;

@Injectable()
export class BullMqMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullMqMetricsService.name);
  private connection?: Redis;
  private queues: Queue[] = [];

  onModuleInit(): void {
    if (process.env.ENABLE_OTEL !== 'true') return;

    // Dedicated connection: BullMQ tunes connection settings, so don't share the
    // app's main Redis client.
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
      ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
      maxRetriesPerRequest: null,
    });
    this.queues = QUEUE_NAMES.map((name) => new Queue(name, { connection: this.connection }));

    const meter = metrics.getMeter('bullmq');

    const jobsGauge = meter.createObservableGauge('bullmq.queue.jobs', {
      description: 'Number of BullMQ jobs by queue and state',
      unit: '{job}',
    });
    jobsGauge.addCallback(async (result) => {
      for (const queue of this.queues) {
        try {
          const counts = await queue.getJobCounts(...JOB_STATES);
          for (const state of JOB_STATES) {
            result.observe(counts[state] ?? 0, { 'queue.name': queue.name, state });
          }
        } catch (e) {
          this.logger.warn(`[bullmq-metrics] job counts failed for ${queue.name}: ${(e as Error).message}`);
        }
      }
    });

    const workersGauge = meter.createObservableGauge('bullmq.queue.workers', {
      description: 'Number of active BullMQ workers by queue',
      unit: '{worker}',
    });
    workersGauge.addCallback(async (result) => {
      for (const queue of this.queues) {
        try {
          const workers = await queue.getWorkers();
          result.observe(workers.length, { 'queue.name': queue.name });
        } catch (e) {
          this.logger.warn(`[bullmq-metrics] worker count failed for ${queue.name}: ${(e as Error).message}`);
        }
      }
    });

    this.logger.log(`[bullmq-metrics] observing ${this.queues.length} queues`);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(this.queues.map((q) => q.close()));
    this.connection?.disconnect();
  }
}
