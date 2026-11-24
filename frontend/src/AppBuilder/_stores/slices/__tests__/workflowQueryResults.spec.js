import { classifyWorkflowEvent, syncWorkflowOutcome } from '../workflowQueryResults';

describe('syncWorkflowOutcome', () => {
  it('passes a completed run through as success with its output', () => {
    expect(
      syncWorkflowOutcome({ executionStatus: 'completed', data: { total: 3 }, metadata: { response: {} } })
    ).toEqual({ ok: true, result: { data: { total: 3 }, metadata: { response: {} } } });
  });

  it('reports a run paused at a Wait or Human node as a waiting success', () => {
    expect(
      syncWorkflowOutcome({ executionStatus: 'waiting', executionId: 'run-1', requestId: 'req-1', syncExecution: true })
    ).toEqual({ ok: true, result: { data: { executionStatus: 'waiting', executionId: 'run-1', requestId: 'req-1' } } });
  });

  it('treats any other status as a failure', () => {
    expect(syncWorkflowOutcome({ executionStatus: 'failed' })).toEqual({ ok: false });
  });
});

describe('classifyWorkflowEvent', () => {
  it('completes an async run that paused, with a waiting result', () => {
    const event = {
      type: 'workflow_execution_waiting',
      executionId: 'run-1',
      result: { data: { executionStatus: 'waiting', executionId: 'run-1', requestId: 'req-1' } },
    };

    expect(classifyWorkflowEvent(event)).toEqual({ status: 'COMPLETE', result: event.result, data: event });
  });

  it.each([
    ['workflow_connection_close', 'CLOSE'],
    ['workflow_execution_completed', 'COMPLETE'],
    ['workflow_execution_error', 'ERROR'],
    ['workflow_execution_cancelled', 'CANCELLED'],
    ['workflow_execution_running', 'PROGRESS'],
  ])('maps %s to %s as before', (type, status) => {
    expect(classifyWorkflowEvent({ type }).status).toBe(status);
  });
});
