import { Controller, Sse, Param, ForbiddenException, NotFoundException, MessageEvent, UseGuards } from '@nestjs/common';
import { Observable, map, finalize } from 'rxjs';
import { BackgroundProcessorService } from './service';
import { SseProgressEvent } from './types';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';

/**
 * Background Processor Controller
 *
 * Provides SSE endpoint for clients to subscribe to job progress events.
 * Supports multi-pod deployments via Redis pub/sub.
 *
 * ## How to Start a Job
 *
 * Jobs are NOT started via this controller. Instead, inject `BackgroundProcessorUtilService`
 * into your own service/controller and call `startJob()` with your task definitions.
 *
 * @example
 * ```typescript
 * // In your service:
 * @Injectable()
 * export class MyFeatureService {
 *   constructor(private readonly backgroundProcessor: BackgroundProcessorUtilService) {}
 *
 *   async startMyProcess(userId: string) {
 *     const tasks: ProcessInfo[] = [
 *       { task: 'Step 1', process: async () => { ... }, weightage: 30 },
 *       { task: 'Step 2', process: async () => { ... } },
 *     ];
 *
 *     return this.backgroundProcessor.startJob(tasks, { userId });
 *   }
 * }
 *
 * // In your controller:
 * @Post('my-feature/start')
 * async startMyFeature(@Req() req: any) {
 *   return this.myFeatureService.startMyProcess(req.user.id);
 * }
 * ```
 *
 * ## Client Usage
 *
 * 1. Call your endpoint to start a job → receive `{ jobId, processInfo }`
 * 2. Subscribe to SSE: `new EventSource('/jobs/:jobId/events?token=<jwt>')`
 * 3. Handle events: 'running', 'completed', 'failed', 'done'
 *
 * ## Multi-Pod Support
 *
 * Jobs can be started on any pod and SSE requests can hit any pod.
 * Events are distributed via Redis pub/sub automatically.
 */
@Controller('jobs')
export class BackgroundProcessorController {
  constructor(private readonly processor: BackgroundProcessorService) {}

  /**
   * GET /jobs/:jobId/events
   * SSE endpoint — guarded by JWT, validates job ownership.
   *
   * @remarks
   * EventSource doesn't support custom headers, so JWT must be sent as query param:
   * `new EventSource('/jobs/123/events?token=<jwt>')`
   *
   * Your JwtStrategy needs to read from query fallback.
   */
  @Sse(':jobId/events')
  @UseGuards(JwtAuthGuard)
  async streamEvents(@Param('jobId') jobId: string, @User() user: UserEntity): Promise<Observable<MessageEvent>> {
    const stream$ = await this.processor.getEventStream(jobId, user.id);

    if (stream$ === null) {
      throw new NotFoundException(`Job ${jobId} not found or already completed`);
    }
    if (stream$ === 'FORBIDDEN') {
      throw new ForbiddenException('You do not own this job');
    }

    return stream$.pipe(
      map(
        (event: SseProgressEvent): MessageEvent => ({
          data: event,
          type: 'progress',
        })
      ),
      // Cleanup when client disconnects or observable completes
      finalize(() => {
        this.processor.cleanupSubscription(jobId);
      })
    );
  }
}
