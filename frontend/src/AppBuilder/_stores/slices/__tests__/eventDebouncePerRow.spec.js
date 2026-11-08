/**
 * Debounce identity for a List View row.
 *
 * `executeAction` is wrapped in `debounce`, which cancels any pending call sharing the same key.
 * Inside a List View one event definition is shared by every row, so the key must also carry the
 * row — otherwise typing in one row cancels the action another row is still waiting on.
 */
import { debounce } from '@/AppBuilder/_stores/utils';

const EVENT = { id: 'evt-1', event: { debounce: 2000 } };

describe('event debounce inside a List View', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('[Listview-BUG-007] a debounced action in one row does not cancel another row s', () => {
    // Break this catches: keying the pending timer by event id alone, so the last row to fire wins
    // and every earlier row's action is silently dropped.
    const run = jest.fn();
    const debounced = debounce(run);

    debounced(EVENT, 'view', {}, 'canvas', 0);
    debounced(EVENT, 'view', {}, 'canvas', 1);
    jest.advanceTimersByTime(2500);

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls.map((call) => call[4])).toEqual([0, 1]);
  });

  it('[Listview-BUG-007] repeated typing within one row still collapses to a single run', () => {
    // Break this catches: keying by row so finely that debounce stops debouncing at all.
    const run = jest.fn();
    const debounced = debounce(run);

    debounced(EVENT, 'view', {}, 'canvas', 0);
    debounced(EVENT, 'view', {}, 'canvas', 0);
    jest.advanceTimersByTime(2500);

    expect(run).toHaveBeenCalledTimes(1);
  });
});
