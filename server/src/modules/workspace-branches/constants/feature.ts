import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.WORKSPACE_BRANCHES]: {
    [FEATURE_KEY.LIST_BRANCHES]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.CREATE_BRANCH]: { license: LICENSE_FIELD.GIT_SYNC, auditLogsKey: 'BRANCH_CREATE' },
    [FEATURE_KEY.SWITCH_BRANCH]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.DELETE_BRANCH]: { license: LICENSE_FIELD.GIT_SYNC, auditLogsKey: 'BRANCH_DELETE' },
    // Git Sync pushes and pulls are audited when the git operation finishes (GitSyncAuditService). The
    // import/export they run sets request audit fields as a side effect, so the per-request row is skipped.
    [FEATURE_KEY.PUSH_WORKSPACE]: { license: LICENSE_FIELD.GIT_SYNC, skipAuditLogs: true },
    [FEATURE_KEY.PULL_WORKSPACE]: { license: LICENSE_FIELD.GIT_SYNC, skipAuditLogs: true },
    [FEATURE_KEY.RESOLVE_CONFLICTS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.CHECK_UPDATES]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.LIST_REMOTE_BRANCHES]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.FETCH_PULL_REQUESTS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.ENSURE_DRAFT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.PULL_APP]: { license: LICENSE_FIELD.GIT_SYNC, skipAuditLogs: true },
    [FEATURE_KEY.PULL_MODULE]: { license: LICENSE_FIELD.GIT_SYNC, skipAuditLogs: true },
    [FEATURE_KEY.GET_ENTITY_TAGS]: { license: LICENSE_FIELD.GIT_SYNC },
  },
};
