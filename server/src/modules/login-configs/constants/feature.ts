import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.LOGIN_CONFIGS]: {
    [FEATURE_KEY.GET_PUBLIC_CONFIGS]: {
      isPublic: true,
    },
    [FEATURE_KEY.GET_ORGANIZATION_CONFIGS]: {},
    [FEATURE_KEY.UPDATE_ORGANIZATION_SSO]: {
      auditLogsKey: 'SSO_UPDATE',
    },
    [FEATURE_KEY.UPDATE_ORGANIZATION_GENERAL_CONFIGS]: {
      auditLogsKey: 'WORKSPACE_LOGIN_SETTINGS_UPDATE',
    },
    [FEATURE_KEY.INSTANCE_SSO_INHERIT]: {
      auditLogsKey: 'INSTANCE_SSO_INHERIT',
    },
    [FEATURE_KEY.UPDATE_INSTANCE_SSO]: {},
    [FEATURE_KEY.UPDATE_INSTANCE_GENERAL_CONFIGS]: {
      auditLogsKey: 'INSTANCE_LOGIN_SETTINGS_UPDATE',
    },
    [FEATURE_KEY.GET_INSTANCE_SSO]: {},
  },
};
