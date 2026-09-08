import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.GIT_SYNC_CONFIGS]: {
    [FEATURE_KEY.GET_ORGANIZATION_GIT]: {},
    [FEATURE_KEY.GET_ORGANIZATION_GIT_STATUS]: {},
    [FEATURE_KEY.CREATE_ORGANIZATION_GIT]: { license: LICENSE_FIELD.GIT_SYNC },
    [FEATURE_KEY.UPDATE_PROVIDER_CONFIGS]: { license: LICENSE_FIELD.GIT_SYNC },
    // No endpoint-level license gate: turning git sync OFF must work even when the git-sync
    // license is off (so a workspace whose license lapsed can disconnect). Enabling still
    // requires the license — enforced inside the service (updateOrgGitStatus).
    [FEATURE_KEY.UPDATE_ORGANIZATION_GIT_STATUS]: {},
    // Deleting/disconnecting a provider must always be possible so the user can turn git off.
    [FEATURE_KEY.DELETE_ORGANIZATION_GIT_CONFIGS]: {},
  },
};
