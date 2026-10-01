/** @group workflows */
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

describe('WorkflowExecutionsService | resumed execution logs', () => {
  const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService & {
    getInitialExecutionLogs: (execution: object, injectedState?: Record<string, any>) => any[];
  };

  const logs = [{ nodeId: 'runjs-1', message: 'Execution succeeded', status: 'success' }];

  it('preserves logs captured before a timed Wait resumes', () => {
    const result = service.getInitialExecutionLogs(
      { logs },
      { __waitResume: { nodeId: 'wait-1', resumeAt: '2026-09-23T10:00:00.000Z' } }
    );

    expect(result).toEqual(logs);
    expect(result).not.toBe(logs);
  });

  it('preserves logs captured before a Human node resumes', () => {
    expect(service.getInitialExecutionLogs({ logs }, { __humanDecision: { outcome: 'approved' } })).toEqual(logs);
  });

  it('starts with empty logs for a fresh or preview execution', () => {
    expect(service.getInitialExecutionLogs({ logs })).toEqual([]);
    expect(service.getInitialExecutionLogs({ logs }, { previewValue: true })).toEqual([]);
  });
});
