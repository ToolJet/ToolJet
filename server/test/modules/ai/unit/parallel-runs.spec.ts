import { parallelRunPolicy, parallelRunRefusal } from '@ee/ai/services/credit-limits';

const policy = { maxRuns: 3, headroomPercent: 20 };

/** @group ai */
describe('parallel AI runs: decision', () => {
  it.each([
    ['nothing running, 15% left (s7 check only)', 0, 15, null],
    ['nothing running, 0% left', 0, 0, null],
    ['1 running, 50% left', 1, 50, null],
    ['2 running, exactly 20% left', 2, 20, null],
    ['3 running, 90% left (cap)', 3, 90, 'run_cap'],
    ['1 running, 15% left (headroom)', 1, 15, 'headroom'],
    ['3 running, 10% left: the cap is reported', 3, 10, 'run_cap'],
    ['headroom unknown, 2 running: cap only', 2, null, null],
    ['headroom unknown, 3 running: cap only', 3, null, 'run_cap'],
  ] as const)('%s', (_name, running, leftPercent, expected) => {
    expect(parallelRunRefusal({ running, leftPercent, ...policy })).toBe(expected);
  });
});

describe('parallel AI runs: env (AC9)', () => {
  it('uses the configured cap and threshold', () => {
    const p = parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: '1', AI_CREDIT_PARALLEL_HEADROOM_PERCENT: '50' });
    expect(p).toEqual({ maxRuns: 1, headroomPercent: 50 });
    expect(parallelRunRefusal({ running: 1, leftPercent: 90, ...p })).toBe('run_cap');
  });

  it('threshold 50 refuses a second run at 40% left', () => {
    const p = parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: '5', AI_CREDIT_PARALLEL_HEADROOM_PERCENT: '50' });
    expect(parallelRunRefusal({ running: 1, leftPercent: 40, ...p })).toBe('headroom');
  });

  it('unset → defaults 3 and 20', () => {
    expect(parallelRunPolicy({})).toEqual({ maxRuns: 3, headroomPercent: 20 });
  });

  it.each([
    ['0', '-1'],
    ['-2', '150'],
    ['abc', 'abc'],
    ['1.5', ''],
    ['', ' '],
  ])('invalid (%p, %p) → defaults 3 and 20', (max, headroom) => {
    expect(
      parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: max, AI_CREDIT_PARALLEL_HEADROOM_PERCENT: headroom })
    ).toEqual({ maxRuns: 3, headroomPercent: 20 });
  });
});
