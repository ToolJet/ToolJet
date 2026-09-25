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

  // A `typeof === 'string'` check above passes for ANY string, including a wrong one — which is
  // exactly how three of the frontend's parallel status labels shipped wrong (see
  // executionRows.spec.js's label-coverage test). Pin the exact English on this side of the seam
  // too, so a typo'd or swapped label fails loudly instead of silently matching `typeof`.
  it('pins the exact label text for every trigger type', () => {
    expect(TRIGGER_TYPE_LABELS).toEqual({
      manual: 'Manual',
      schedule: 'Scheduled (Cron)',
      webhook: 'API Webhook',
      app: 'Event',
      workflow: 'Sub-workflow',
      unknown: 'Unknown',
    });
  });

  it('names the app trigger Event, matching the dashboard', () => {
    expect(TRIGGER_TYPE_LABELS[WORKFLOW_TRIGGER_TYPE.APP]).toBe('Event');
  });
});
