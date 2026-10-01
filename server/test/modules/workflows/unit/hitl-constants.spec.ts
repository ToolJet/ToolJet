import { mapDbStatusToDisplayState } from '@modules/workflows/constants';
import { MODULES } from '@modules/app/constants/modules';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { FEATURES } from '@modules/workflows/constants/feature';
import { AuditLogsUtilService } from '@ee/audit-logs/util.service';

/** @group workflows */
describe('mapDbStatusToDisplayState', () => {
  it('maps the DB status "waiting" to the display state "waiting"', () => {
    expect(mapDbStatusToDisplayState('waiting')).toBe('waiting');
  });

  it('maps a timed delay to the display state "waiting"', () => {
    expect(mapDbStatusToDisplayState('waiting_for_delay')).toBe('waiting');
  });
});

/** @group workflows */
describe('HITL audit log registration', () => {
  it('should offer the approval resolution in the Workflows action filter', () => {
    const resources = new AuditLogsUtilService().transformResources(MODULE_INFO);
    expect(resources[MODULES.WORKFLOWS]).toEqual(
      expect.arrayContaining([{ name: 'WORKFLOW_APPROVAL_RESOLVED', value: 'WORKFLOW_APPROVAL_RESOLVED' }])
    );
  });

  it('should leave logging the approval routes to the service, not the response interceptor', () => {
    // The service writes the entry with the decision metadata; the interceptor must not add a
    // second, metadata-less one for the token routes.
    expect(FEATURES[MODULES.WORKFLOWS][FEATURE_KEY.HUMAN_IN_THE_LOOP]).toMatchObject({ skipAuditLogs: true });
  });
});
