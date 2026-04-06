import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Subject, Observable } from 'rxjs';
import { JobContext, ResolvedProcessInfo, SseProgressEvent } from './types';
import { TransactionLogger } from '@modules/logging/service';
import { RedisService } from '@modules/redis/service';

/**
 * Redis key prefixes for job storage
 */
const REDIS_KEY_PREFIX = 'bg_job:';
const REDIS_CHANNEL_PREFIX = 'bg_job_events:';
const JOB_TTL_SECONDS = 3600; // 1 hour TTL for job metadata

/**
 * Serializable job metadata stored in Redis
 */
interface RedisJobMetadata {
  userId: string;
  resolvedInfo: string; // JSON string of ResolvedProcessInfo[]
  createdAt: number;
}

/**
 * Redis-backed job store for multi-pod support.
 *
 * Architecture:
 * - Job metadata (userId, resolvedInfo) stored in Redis with TTL
 * - Events published via Redis Pub/Sub channel per job
 * - Local Subject maintains SSE connection on the subscribing pod
 */
@Injectable()
export class BackgroundProcessorJobStore implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  /**
   * Local subjects for SSE connections on THIS pod.
   * Key: jobId, Value: Subject for streaming to connected clients
   */
  private localSubjects = new Map<string, Subject<SseProgressEvent>>();

  constructor(
    private readonly transactionLogger: TransactionLogger,
    private readonly redisService: RedisService
  ) {}

  onModuleInit() {
    // Use shared Redis client for publishing and general operations
    this.publisher = this.redisService.getClient();

    // Create dedicated subscriber connection for pub/sub
    // (pub/sub requires a dedicated connection as it enters a special mode)
    this.subscriber = this.redisService.createSubscriber();

    // Handle incoming messages from Redis pub/sub
    this.subscriber.on('message', (channel: string, message: string) => {
      const jobId = channel.replace(REDIS_CHANNEL_PREFIX, '');
      const localSubject = this.localSubjects.get(jobId);

      if (localSubject) {
        try {
          const event: SseProgressEvent = JSON.parse(message);
          localSubject.next(event);

          // Complete and cleanup on 'done' status
          if (event.status === 'done') {
            localSubject.complete();
            this.localSubjects.delete(jobId);
            this.subscriber.unsubscribe(channel);
          }
        } catch (err) {
          this.transactionLogger.error(`[BackgroundProcessorJobStore] Failed to parse event for jobId: ${jobId}`, err);
        }
      }
    });

    this.transactionLogger.log('[BackgroundProcessorJobStore] Redis connections initialized');
  }

  onModuleDestroy() {
    // Complete all local subjects
    this.localSubjects.forEach((subject) => subject.complete());
    this.localSubjects.clear();

    // Disconnect only the subscriber (we created it)
    // Don't disconnect publisher as it's the shared RedisService client
    this.subscriber?.disconnect();
  }

  /**
   * Stores job metadata in Redis and creates local Subject for event streaming.
   * Called by the pod that starts the job.
   */
  async set(jobId: string, context: Omit<JobContext, 'subject'>): Promise<Subject<SseProgressEvent>> {
    const metadata: RedisJobMetadata = {
      userId: context.userId,
      resolvedInfo: JSON.stringify(context.resolvedInfo),
      createdAt: Date.now(),
    };

    // Store metadata in Redis with TTL
    await this.publisher.setex(`${REDIS_KEY_PREFIX}${jobId}`, JOB_TTL_SECONDS, JSON.stringify(metadata));

    // Create local subject for this pod (the executor pod)
    const subject = new Subject<SseProgressEvent>();
    this.localSubjects.set(jobId, subject);

    // Subscribe to job's event channel for cross-pod events
    await this.subscriber.subscribe(`${REDIS_CHANNEL_PREFIX}${jobId}`);

    this.transactionLogger.log(`[BackgroundProcessorJobStore] Job ${jobId} stored in Redis`);
    return subject;
  }

  /**
   * Retrieves job metadata from Redis.
   * Returns null if job doesn't exist or has expired.
   */
  async getMetadata(jobId: string): Promise<{ userId: string; resolvedInfo: ResolvedProcessInfo[] } | null> {
    const data = await this.publisher.get(`${REDIS_KEY_PREFIX}${jobId}`);
    if (!data) return null;

    try {
      const metadata: RedisJobMetadata = JSON.parse(data);
      return {
        userId: metadata.userId,
        resolvedInfo: JSON.parse(metadata.resolvedInfo),
      };
    } catch (err) {
      this.transactionLogger.error(`[BackgroundProcessorJobStore] Failed to parse metadata for jobId: ${jobId}`, err);
      return null;
    }
  }

  /**
   * Gets local Subject if it exists on this pod.
   * Used by the executing pod to emit events.
   */
  getLocalSubject(jobId: string): Subject<SseProgressEvent> | undefined {
    return this.localSubjects.get(jobId);
  }

  /**
   * Checks if job exists in Redis.
   */
  async has(jobId: string): Promise<boolean> {
    const exists = await this.publisher.exists(`${REDIS_KEY_PREFIX}${jobId}`);
    return exists === 1;
  }

  /**
   * Deletes job metadata from Redis and cleans up local resources.
   */
  async delete(jobId: string): Promise<void> {
    await this.publisher.del(`${REDIS_KEY_PREFIX}${jobId}`);

    const localSubject = this.localSubjects.get(jobId);
    if (localSubject) {
      localSubject.complete();
      this.localSubjects.delete(jobId);
    }

    await this.subscriber.unsubscribe(`${REDIS_CHANNEL_PREFIX}${jobId}`);
    this.transactionLogger.log(`[BackgroundProcessorJobStore] Job ${jobId} deleted from Redis`);
  }

  /**
   * Publishes an event to Redis channel for cross-pod distribution.
   */
  async publishEvent(jobId: string, event: SseProgressEvent): Promise<void> {
    await this.publisher.publish(`${REDIS_CHANNEL_PREFIX}${jobId}`, JSON.stringify(event));
  }

  /**
   * Subscribes to job events and returns an Observable.
   * Used by pods receiving SSE requests for jobs started on other pods.
   */
  async subscribeToEvents(jobId: string): Promise<Observable<SseProgressEvent>> {
    // Check if we already have a local subject (we're the executor pod)
    let subject = this.localSubjects.get(jobId);

    if (!subject) {
      // Create new subject for this subscriber pod
      subject = new Subject<SseProgressEvent>();
      this.localSubjects.set(jobId, subject);

      // Subscribe to Redis channel
      await this.subscriber.subscribe(`${REDIS_CHANNEL_PREFIX}${jobId}`);
      this.transactionLogger.log(`[BackgroundProcessorJobStore] Subscribed to events for jobId: ${jobId}`);
    }

    return subject.asObservable();
  }

  /**
   * Cleans up subscription resources when SSE client disconnects.
   * Called from controller's finalize operator.
   *
   * @remarks
   * This only cleans up if this pod is a subscriber (not the executor).
   * The executor pod's cleanup happens via delete() when job completes.
   */
  cleanupSubscription(jobId: string): void {
    const localSubject = this.localSubjects.get(jobId);

    // Only cleanup if we have a local subject and it's not already closed
    if (localSubject && !localSubject.closed) {
      this.transactionLogger.log(`[BackgroundProcessorJobStore] Cleaning up subscription for jobId: ${jobId}`);

      // Complete the subject (signals end to any remaining observers)
      localSubject.complete();

      // Remove from local map
      this.localSubjects.delete(jobId);

      // Unsubscribe from Redis channel
      this.subscriber.unsubscribe(`${REDIS_CHANNEL_PREFIX}${jobId}`).catch((err) => {
        this.transactionLogger.error(
          `[BackgroundProcessorJobStore] Failed to unsubscribe from channel for jobId: ${jobId}`,
          err
        );
      });
    }
  }
}
