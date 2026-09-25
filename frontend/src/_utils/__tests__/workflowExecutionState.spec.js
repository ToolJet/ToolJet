import {
  getExecutionDisplayState,
  getExecutionDisplayConfig,
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

// I6: getExecutionDisplayConfig's icon mapping was never pinned when 'unknown' was added, so the
// workflow editor's LogsPanel (RunItems.jsx) — the only production consumer of this icon field —
// dispatched every unrecognised icon key to its Failure icon, turning a dead/jobless run into a
// false "this failed" report. Pin the full icon map here, keyed by display state, so 'unknown'
// staying distinct from both 'success' and 'error' cannot silently regress.
describe('getExecutionDisplayConfig — icon mapping', () => {
  it('assigns a distinct, neutral icon key to unknown — neither success nor error', () => {
    const config = getExecutionDisplayConfig({ executed: false, status: null, startedAt: minutesAgo(60) });
    expect(config.icon).toBe('unknown');
    expect(config.icon).not.toBe('success');
    expect(config.icon).not.toBe('error');
  });

  it('pins the icon key for every display state RunItems.jsx dispatches on', () => {
    const iconFor = (execution) => getExecutionDisplayConfig(execution).icon;

    expect(iconFor({ executed: true, status: 'success' })).toBe('success');
    expect(iconFor({ executed: true, status: 'failure' })).toBe('error');
    expect(iconFor({ executed: true, status: 'terminated' })).toBe('terminated');
    expect(iconFor({ executed: false, status: 'waiting' })).toBe('waiting');
    expect(iconFor({ executed: false, status: null, startedAt: minutesAgo(60) })).toBe('unknown');
    // pending/running carry no icon — RunItems.jsx shows a spinner instead (showSpinner: true).
    expect(iconFor({ executed: false, status: null, jobState: 'active' })).toBeNull();
  });
});
