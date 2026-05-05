import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';

export const FEATURES: FeaturesConfig = {
  [MODULES.SSL_CONFIGURATION]: {
    [FEATURE_KEY.GET]: { isSuperAdminFeature: true },
    [FEATURE_KEY.VALIDATE]: { isSuperAdminFeature: true },
    [FEATURE_KEY.CERTIFICATE_STATUS]: { isSuperAdminFeature: true },
    [FEATURE_KEY.UPDATE]: { license: LICENSE_FIELD.SSL_TERMINATION, isSuperAdminFeature: true },
    [FEATURE_KEY.ACQUIRE_CERTIFICATE]: { license: LICENSE_FIELD.SSL_TERMINATION, isSuperAdminFeature: true },
    [FEATURE_KEY.RENEW_CERTIFICATE]: { license: LICENSE_FIELD.SSL_TERMINATION, isSuperAdminFeature: true },
    [FEATURE_KEY.REQUEST_DOMAIN_CHANGE]: { license: LICENSE_FIELD.SSL_TERMINATION, isSuperAdminFeature: true },
    [FEATURE_KEY.CANCEL_DOMAIN_CHANGE]: { license: LICENSE_FIELD.SSL_TERMINATION, isSuperAdminFeature: true },
  },
};
