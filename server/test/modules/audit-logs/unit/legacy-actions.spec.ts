/** @group platform */
import { AUDIT_ONLY_ACTIONS, expandLegacyActions } from '@modules/audit-logs/constants';

describe('Audit Logs action filter', () => {
  it('should also match rows written under the old Git Sync names', () => {
    expect(expandLegacyActions(['WORKSPACE_PULL_COMMIT', 'RESOURCE_PUSH_COMMIT', 'USER_LOGIN'])).toEqual([
      'WORKSPACE_PULL_COMMIT',
      'MASTER_PULL_COMMIT',
      'RESOURCE_PUSH_COMMIT',
      'GIT_SYNC_PUSH',
      'USER_LOGIN',
    ]);
  });

  it('should offer the five Git Sync actions even though no route writes them', () => {
    expect(AUDIT_ONLY_ACTIONS.GitSync).toEqual([
      'RESOURCE_PUSH_COMMIT',
      'RESOURCE_DELETE_PUSH_COMMIT',
      'RESOURCE_PULL_COMMIT',
      'WORKSPACE_PUSH_COMMIT',
      'WORKSPACE_PULL_COMMIT',
    ]);
  });
});
