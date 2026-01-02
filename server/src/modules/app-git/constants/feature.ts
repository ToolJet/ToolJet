import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_GIT]: {
    [FEATURE_KEY.GIT_CREATE_APP]: { license: LICENSE_FIELD.GIT_SYNC }, // Used for importing an application from git to any workspace
    [FEATURE_KEY.GIT_GET_APP]: { license: LICENSE_FIELD.GIT_SYNC }, // Used to fetch the latest git commit data for syncing the application
    [FEATURE_KEY.GIT_GET_APPS]: { license: LICENSE_FIELD.GIT_SYNC }, // Used for listing all the application from GIT
    [FEATURE_KEY.GIT_GET_APP_CONFIG]: { license: LICENSE_FIELD.GIT_SYNC }, // Used for getting latest app configs and creates an application if app is not already created
    [FEATURE_KEY.GIT_SYNC_APP]: { license: LICENSE_FIELD.GIT_SYNC }, // Push an application to git
    [FEATURE_KEY.GIT_UPDATE_APP]: { license: LICENSE_FIELD.GIT_SYNC }, // Update the application with latest git commit
    [FEATURE_KEY.GIT_APP_VERSION_RENAME]: { license: LICENSE_FIELD.GIT_SYNC }, // Rename app/version name
    [FEATURE_KEY.GIT_APP_CONFIGS_UPDATE]: { license: LICENSE_FIELD.GIT_SYNC }, // Used to update the permission to allow app edit for imported applications
    [FEATURE_KEY.GIT_FETCH_APP_CONFIGS]: {}, // Used for fetching app configs
  },
};
