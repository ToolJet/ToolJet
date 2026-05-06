import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constant';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.VALIDATE]: FeatureConfig;
  [FEATURE_KEY.ACQUIRE_CERTIFICATE]: FeatureConfig;
  [FEATURE_KEY.CERTIFICATE_STATUS]: FeatureConfig;
  [FEATURE_KEY.RENEW_CERTIFICATE]: FeatureConfig;
  [FEATURE_KEY.REQUEST_DOMAIN_CHANGE]: FeatureConfig;
  [FEATURE_KEY.CANCEL_DOMAIN_CHANGE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SSL_CONFIGURATION]: Features;
}
