/// <reference types="jest" />
import { singleFlight } from '@modules/data-queries/oauth-single-flight.util';

describe('singleFlight (shared OAuth refresh)', () => {
  it('concurrent callers with the same key share one execution and one result', async () => {
    const inFlight = new Map<string, Promise<number>>();
    let executions = 0;
    const factory = async () => {
      executions += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return executions;
    };

    const results = await Promise.all([
      singleFlight(inFlight, 'ds:1:dev', factory),
      singleFlight(inFlight, 'ds:1:dev', factory),
      singleFlight(inFlight, 'ds:1:dev', factory),
    ]);

    expect(executions).toBe(1);
    expect(results).toEqual([1, 1, 1]);
  });

  it('different keys execute independently', async () => {
    const inFlight = new Map<string, Promise<string>>();
    const seen: string[] = [];
    const make = (label: string) => async () => {
      seen.push(label);
      return label;
    };

    const [a, b] = await Promise.all([singleFlight(inFlight, 'k1', make('a')), singleFlight(inFlight, 'k2', make('b'))]);

    expect([a, b]).toEqual(['a', 'b']);
    expect(seen.sort()).toEqual(['a', 'b']);
  });

  it('every waiter observes the same rejection, and a later attempt runs again', async () => {
    const inFlight = new Map<string, Promise<void>>();
    let attempts = 0;
    const failFirst = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('refresh rejected');
    };

    const settled = await Promise.allSettled([
      singleFlight(inFlight, 'k', failFirst),
      singleFlight(inFlight, 'k', failFirst),
    ]);
    expect(settled.every((r) => r.status === 'rejected')).toBe(true);
    expect(attempts).toBe(1);

    // The map entry is cleared after settle, so the next expiry refreshes again.
    await expect(singleFlight(inFlight, 'k', failFirst)).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});
