/** @group workflows */

import { WORKFLOW_TRIGGER_TYPE } from '@modules/workflows/types';

describe('WORKFLOW_TRIGGER_TYPE', () => {
  it('covers every way an execution can start', () => {
    expect(Object.values(WORKFLOW_TRIGGER_TYPE).sort()).toEqual(
      ['app', 'manual', 'schedule', 'unknown', 'webhook', 'workflow'].sort()
    );
  });
});
