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
    [FEATURE_KEY.PUSH_WORKSPACE]: { license: LICENSE_FIELD.GIT_SYNC, auditLogsKey: 'WORKSPACE_PUSH_COMMIT' },
    [FEATURE_KEY.PULL_WORKSPACE]: { license: LICENSE_FIELD.GIT_SYNC, auditLogsKey: 'MASTER_PULL_COMMIT' },
    [FEATURE_KEY.CHECK_UPDATES]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.LIST_REMOTE_BRANCHES]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.FETCH_PULL_REQUESTS]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.ENSURE_DRAFT]: { license: LICENSE_FIELD.GIT_SYNC },
  },
};
