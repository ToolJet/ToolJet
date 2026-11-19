import { scheduleJitterMs } from '@modules/workflows/admission/schedule-jitter';

/**
 * The fixed start offset that spreads schedules sharing a cron (D44).
 *
 * @group workflows
 */
describe('scheduleJitterMs', () => {
  it('should give a schedule the same offset every time, within the maximum', () => {
    const offset = scheduleJitterMs('3f1c7e9a-0000-4000-8000-000000000001', 30);

    expect(offset).toBe(scheduleJitterMs('3f1c7e9a-0000-4000-8000-000000000001', 30));
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThanOrEqual(30_000);
  });

  it('should spread many schedules across the window', () => {
    const offsets = Array.from({ length: 200 }, (_, i) => scheduleJitterMs(`schedule-${i}`, 30));
    const seconds = new Set(offsets.map((ms) => Math.floor(ms / 1000)));

    // 200 schedules land in most of the 31 one-second buckets, not one
    expect(seconds.size).toBeGreaterThan(25);
  });

  it('should be 0 when jitter is off', () => {
    expect(scheduleJitterMs('schedule-1', 0)).toBe(0);
  });
});
