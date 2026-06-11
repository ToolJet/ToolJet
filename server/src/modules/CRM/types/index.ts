import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
export interface CRMData {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isTrialOpted?: boolean;
  isCloudTrialOpted?: boolean;
  paymentTry?: boolean;
  isInvited?: boolean;
  isSignedUpUsingGoogleSSO?: boolean;
  isSignedUpUsingGithubSSO?: boolean;
  utmParams?: Record<string, any>;
}
interface Features {
  [FEATURE_KEY.CRM_PUSH]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CRM]: Features;
}
