# Redis / BullMQ in E2E Tests

## Current Setup

`BullModule.forRoot()` is loaded globally (in `loader.ts`) even in test mode. In test mode, the ioredis connection is configured with:

```typescript
retryStrategy: () => null   // no reconnection after disconnect
maxRetriesPerRequest: null  // required by BullMQ
```

This means:
- If Redis **is running**, BullMQ connects normally. Workers process jobs. On `app.close()`, workers are shut down.
- If Redis **is not running**, ioredis fails once and gives up (no retry loop that congests the event loop).

## Tests That Need Redis

Most e2e tests don't need Redis — they test HTTP endpoints and don't care about async job processing. However, some tests may need Bull queues:

### Option 1: Real Redis (integration tests)

If your test needs actual job processing (e.g., testing workflow execution end-to-end):

1. Ensure Redis is running locally (`redis-server` or Docker).
2. Tests work normally — BullMQ connects, workers process.
3. Clean up any queued jobs in `afterAll`:

```typescript
import { Queue } from 'bullmq';

afterAll(async () => {
  // Drain test queues before closing
  const queue = app.get<Queue>(getQueueToken('your-queue-name'));
  await queue.drain();
  await closeTestApp(app);
});
```

### Option 2: Mock queues (unit/e2e without processing)

If your test only needs to verify that a job WAS enqueued (not that it was processed):

```typescript
import { getQueueToken } from '@nestjs/bullmq';

beforeAll(async () => {
  const { app } = await initTestApp({
    edition: 'ee',
    // No extra imports needed — BullModule is already loaded globally
  });

  // Spy on queue.add to verify jobs are enqueued
  const queue = app.get<Queue>(getQueueToken('app-history'));
  jest.spyOn(queue, 'add').mockResolvedValue({} as any);
});
```

### Option 3: Exclude BullMQ entirely (fastest startup)

If your test module doesn't touch any Bull-injected service, you can override the providers:

```typescript
const moduleBuilder = Test.createTestingModule({
  imports: [YourModuleOnly],
  // Don't import AppModule — build a minimal test module
});
```

## ScheduleModule

`ScheduleModule.forRoot()` is **excluded** in test mode (`NODE_ENV=test`). This means:
- `@Cron()` decorators on scheduler services become inert metadata — no timers fire.
- Scheduler services are still instantiated as regular NestJS providers.
- If you need a cron job to actually fire in a test, use `initTestApp({ extraImports: [ScheduleModule.forRoot()] })`.

## Why forceExit Is Still Needed

BullMQ Workers create ioredis subscriber connections (for `BRPOPLPUSH`/`XREADGROUP`) that survive `app.close()` as native TCP sockets. These are invisible to Jest's `--detectOpenHandles`. `forceExit: true` handles cleanup after all tests pass.

This is NOT the same issue as the connection timeout bug, which was caused by zombie ScheduleModule timers and ioredis reconnection loops accumulating across test files.
