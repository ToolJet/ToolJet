import { mapDbStatusToDisplayState, WORKFLOW_EXECUTION_STATUS } from '@modules/workflows/constants';
import { WorkflowSuspendedSignal } from '@modules/workflows/types';

/** @group workflows */
describe('HITL shared constants & signal', () => {
  it('exposes a non-terminal WAITING execution status', () => {
    expect(WORKFLOW_EXECUTION_STATUS.WAITING).toBe('workflow_execution_waiting');
  });

  it('maps the DB status "waiting" to the display state "waiting"', () => {
    expect(mapDbStatusToDisplayState('waiting')).toBe('waiting');
  });

  it('maps a timed delay to the display state "waiting"', () => {
    expect(mapDbStatusToDisplayState('waiting_for_delay')).toBe('waiting');
  });

  it('WorkflowSuspendedSignal carries executionId and requestId', () => {
    const sig = new WorkflowSuspendedSignal('exec-1', 'req-1');
    expect(sig).toBeInstanceOf(Error);
    expect(sig.name).toBe('WorkflowSuspendedSignal');
    expect(sig).toMatchObject({ executionId: 'exec-1', requestId: 'req-1' });
  });
});
