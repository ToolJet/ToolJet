/** @group workflows */

import { WORKFLOW_TRIGGER_TYPE } from '@modules/workflows/types';
import { TRIGGER_TYPE_LABELS } from '@modules/workflows/types/execution-list';

describe('WORKFLOW_TRIGGER_TYPE', () => {
  it('covers every way an execution can start', () => {
    expect(Object.values(WORKFLOW_TRIGGER_TYPE).sort()).toEqual(
      ['app', 'manual', 'schedule', 'unknown', 'webhook', 'workflow'].sort()
    );
  });

  it('labels every trigger type it defines', () => {
    Object.values(WORKFLOW_TRIGGER_TYPE).forEach((trigger) => {
      expect(typeof TRIGGER_TYPE_LABELS[trigger]).toBe('string');
    });
  });

  it('names the app trigger Event, matching the dashboard', () => {
    expect(TRIGGER_TYPE_LABELS[WORKFLOW_TRIGGER_TYPE.APP]).toBe('Event');
  });
});
