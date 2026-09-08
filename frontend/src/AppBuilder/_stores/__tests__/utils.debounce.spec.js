/**
 * `debounce` wraps `executeAction` in eventsSlice, so every event handler that
 * has a `debounce` configured in the inspector goes through it.
 *
 * Pure function, no store, no DOM. The tests below encode the correct
 * behaviour directly, so no source mutation is needed to prove they bite: the
 * two `test.failing` cases flip to passing the moment the bug is fixed, which
 * is the signal we want.
 */
import { debounce } from '@/AppBuilder/_stores/utils';

// Shape the real caller passes: executeAction receives the event handler row,
// and `debounce` reads `args[0].event.debounce` (eventsSlice.js executeAction).
const handler = (debounceMs) => ({ event: { eventId: 'onClick', actionId: 'show-alert', debounce: debounceMs } });

describe('debounce (event action wrapper)', () => {
  beforeEach(() => jest.useFakeTimers());

  test('runs synchronously and returns the result when no debounce is configured', () => {
    const fn = jest.fn(() => 'returned');
    const wrapped = debounce(fn);

    // This is the path every un-debounced action takes. The return value must
    // survive, because executeActionsForEventId awaits it to run handlers
    // sequentially.
    expect(wrapped({ event: { eventId: 'onClick' } })).toBe('returned');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('delays the call by the configured time', () => {
    const fn = jest.fn();
    const wrapped = debounce(fn);

    wrapped(handler(100));
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test.failing('BUG: rapid calls are never coalesced — N clicks run N actions', () => {
    const fn = jest.fn();
    const wrapped = debounce(fn);

    wrapped(handler(100));
    wrapped(handler(100));
    wrapped(handler(100));
    jest.advanceTimersByTime(100);

    // _stores/utils.js:17 mints `const eventId = uuidv4()` fresh on EVERY call,
    // so `clearTimeout(timers.get(eventId))` at :24 always misses and no timer
    // is ever cancelled. This is a plain delay, not a debounce.
    //
    // User-visible consequence: a debounced button fires its query three times
    // for three fast clicks — exactly what the debounce setting exists to stop.
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test.failing('BUG: the debounced branch returns undefined, so callers cannot await it', () => {
    const fn = jest.fn(() => Promise.resolve('done'));
    const wrapped = debounce(fn);

    // _stores/utils.js:19-31: the debounced branch has no `return`, so
    // `await executeAction(...)` in executeActionsForEventId does not wait.
    // Consequence: handlers execute OUT OF ORDER — every un-debounced action
    // in the same event completes before any debounced one starts — and the
    // deferred call's rejection is unhandled.
    expect(wrapped(handler(100))).toBeInstanceOf(Promise);
  });

  test('a debounced call does not block the caller (documents the ordering hazard)', () => {
    const order = [];
    const debouncedAction = debounce((_event) => order.push('debounced'));
    const plainAction = debounce((_event) => order.push('plain'));

    debouncedAction(handler(50));
    plainAction({ event: { eventId: 'onClick' } });

    // The un-debounced action has already run while the debounced one waits.
    // In eventsSlice this is what breaks the "handlers run sequentially by
    // index" guarantee whenever any handler has a debounce configured.
    expect(order).toEqual(['plain']);

    jest.advanceTimersByTime(50);
    expect(order).toEqual(['plain', 'debounced']);
  });

  test('reads debounce from either the wrapper or the bare object', () => {
    const fromWrapper = jest.fn();
    const fromBare = jest.fn();

    debounce(fromWrapper)({ event: { debounce: 10 } });
    debounce(fromBare)({ debounce: 10 });
    jest.advanceTimersByTime(10);

    expect(fromWrapper).toHaveBeenCalledTimes(1);
    expect(fromBare).toHaveBeenCalledTimes(1);
  });

  test('a debounce of 0 is coerced to "no debounce" and runs inline', () => {
    const fn = jest.fn(() => 'returned');

    // `event?.event?.debounce || event?.debounce` (_stores/utils.js:19) treats a
    // configured `0` as absent, so this takes the synchronous branch and keeps
    // its return value. Benign here, but it is the same `||`-swallows-falsy
    // pattern that has caused real bugs elsewhere in the store — pinned so a
    // change to `??` is a deliberate decision with a failing test, not a
    // silent shift in action ordering.
    expect(debounce(fn)(handler(0))).toBe('returned');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
