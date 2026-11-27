/*
 * Workers announce themselves (R10): each writes "alive until" into one sorted set every few seconds,
 * and a request that needs a worker checks for any entry still in the future. Cheaper than Redis
 * CLIENT LIST (BullMQ's getWorkers), which some managed Redis services disable. Scoped by the
 * queue prefix, so test processes never see each other's workers.
 */
export const WORKER_HEARTBEAT_EVERY_MS = 10_000;
export const WORKER_HEARTBEAT_TTL_MS = 30_000;

export const workerHeartbeatKey = (queuePrefix: string | undefined) => `tj:wf:workers:{${queuePrefix ?? 'bull'}}`;
