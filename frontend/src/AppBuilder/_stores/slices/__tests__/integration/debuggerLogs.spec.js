/**
 * Contract tests for the debugger log store that backs the bottom-panel Debugger.
 *
 * The Debugger lists logs newest first and shows when each one happened. Producers are spread
 * across the App Builder (query runs, transformations, events, component validation, version
 * actions) and several of them do not send a timestamp, so the store has to fill it in. Component
 * validation arrives in batches through `logMultiple`, which must keep the newest-first order too.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();
const logs = () => state().debugger.logs;

beforeEach(() => {
  seedApp({});
  state().debugger.clear();
});

describe('debugger.log', () => {
  it('should stamp a log that arrives without a timestamp', () => {
    state().debugger.log({
      logLevel: 'success',
      type: 'query',
      key: 'getUsers',
      message: 'Query executed successfully',
    });

    expect(logs()[0]).toMatchObject({ key: 'getUsers', timestamp: expect.any(String) });
    expect(Number.isNaN(Date.parse(logs()[0].timestamp))).toBe(false);
  });

  it('should keep a timestamp the producer already set', () => {
    state().debugger.log({ logLevel: 'error', type: 'component', key: 'x', timestamp: '2026-01-01T00:00:00.000Z' });

    expect(logs()[0].timestamp).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should put the newest log first and count only errors as unread', () => {
    state().debugger.log({ logLevel: 'error', key: 'first' });
    state().debugger.log({ logLevel: 'success', key: 'second' });

    expect(logs().map((log) => log.key)).toEqual(['second', 'first']);
    expect(state().debugger.unreadErrorCount).toBe(1);
  });
});

describe('debugger.logMultiple', () => {
  it('should add a batch above existing logs, keeping the batch order, and stamp each entry', () => {
    state().debugger.log({ logLevel: 'error', key: 'older' });
    state().debugger.logMultiple([
      { logLevel: 'error', key: 'batch-a' },
      { logLevel: 'error', key: 'batch-b' },
    ]);

    expect(logs().map((log) => log.key)).toEqual(['batch-a', 'batch-b', 'older']);
    expect(logs()[0]).toMatchObject({ timestamp: expect.any(String), page: expect.anything() });
    expect(state().debugger.unreadErrorCount).toBe(3);
  });
});
