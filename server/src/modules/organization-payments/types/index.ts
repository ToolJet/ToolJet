import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.CREATE_PORTAL_LINK]: FeatureConfig;
  [FEATURE_KEY.GET_CURRENT_PLAN_DETAILS]: FeatureConfig;
  [FEATURE_KEY.GET_PRORATION]: FeatureConfig;
  [FEATURE_KEY.GET_REDIRECT_URL]: FeatureConfig;
  [FEATURE_KEY.GET_UPCOMING_INVOICE]: FeatureConfig;
  [FEATURE_KEY.STRIPE_WEBHOOK]: FeatureConfig;
  [FEATURE_KEY.UPDATE_INVOICE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_SUBSCRIPTION]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATION_PAYMENTS]: Features;
}
