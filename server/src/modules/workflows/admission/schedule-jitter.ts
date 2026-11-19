import { createHash } from 'crypto';

/*
 * How long after its time a schedule's run starts: a fixed 0..maxSeconds offset derived from the
 * schedule's id (D44). Every schedule with the same cron otherwise fires in the same second; the
 * offset spreads them, and being stable it keeps each schedule's own runs evenly spaced.
 */
export function scheduleJitterMs(scheduleId: string, maxSeconds: number): number {
  if (!scheduleId || !(maxSeconds > 0)) return 0;
  const bucket = createHash('sha256').update(scheduleId).digest().readUInt32BE(0);
  return bucket % (Math.floor(maxSeconds * 1000) + 1);
}
