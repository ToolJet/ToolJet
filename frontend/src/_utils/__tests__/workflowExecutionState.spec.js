import {
  getExecutionDisplayState,
  getExecutionStatusText,
  isExecutionFinished,
  isExecutionInProgress,
  STALE_EXECUTION_THRESHOLD_MS,
} from '@/_utils/workflowExecutionState';

const minutesAgo = (n) => new Date(Date.now() - n * 60 * 1000).toISOString();

describe('getExecutionDisplayState — existing behaviour (regression pins)', () => {
  it('reports a finished successful run as completed', () => {
    expect(getExecutionDisplayState({ executed: true, status: 'success' })).toBe('completed');
  });

  it('reports a suspended human-in-the-loop run as waiting', () => {
    expect(getExecutionDisplayState({ executed: false, status: 'waiting' })).toBe('waiting');
  });

  it('reports a timed wait node as waiting', () => {
    expect(getExecutionDisplayState({ executed: false, status: 'waiting_for_delay' })).toBe('waiting');
  });

  it('reports an active job as running', () => {
    expect(getExecutionDisplayState({ executed: false, status: null, jobState: 'active' })).toBe('running');
  });

  it('reports a queued job as pending', () => {
    expect(getExecutionDisplayState({ executed: false, status: null, jobState: 'waiting' })).toBe('pending');
  });

  it('still reports a recent jobless run as completed, preserving the editor race behaviour', () => {
    expect(
      getExecutionDisplayState({ executed: false, status: null, startedAt: new Date().toISOString() })
    ).toBe('completed');
  });
});

describe('getExecutionDisplayState — unknown', () => {
  it('reports a long-dead jobless run as unknown rather than completed', () => {
    expect(
      getExecutionDisplayState({ executed: false, status: null, startedAt: minutesAgo(60) })
    ).toBe('unknown');
  });

  it('does not mark a run unknown while it still has a live job', () => {
    expect(
      getExecutionDisplayState({
        executed: false,
        status: null,
        jobState: 'waiting',
        startedAt: minutesAgo(60),
      })
    ).toBe('pending');
  });

  it('falls back to createdAt when startedAt was never written', () => {
    expect(
      getExecutionDisplayState({ executed: false, status: null, createdAt: minutesAgo(60) })
    ).toBe('unknown');
  });

  it('labels the unknown state', () => {
    expect(getExecutionStatusText({ executed: false, status: null, startedAt: minutesAgo(60) })).toBe('Unknown');
  });

  it('uses a five minute floor so a backed-up queue is not called dead', () => {
    expect(STALE_EXECUTION_THRESHOLD_MS).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });

  it('treats unknown as finished, not in progress, so callers waiting on completion do not hang forever', () => {
    const staleExecution = { executed: false, status: null, startedAt: minutesAgo(60) };
    expect(isExecutionFinished(staleExecution)).toBe(true);
    expect(isExecutionInProgress(staleExecution)).toBe(false);
  });
});
