import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constant';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.VERIFY]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.STATUS]: FeatureConfig;
  [FEATURE_KEY.RESOLVE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CUSTOM_DOMAINS]: Features;
}

export interface VerifyDomainResult {
  valid: boolean;
  providerStatus: string;
  sslStatus: string | null;
  verificationErrors?: any;
  dnsStatus: 'not_checked' | 'resolved' | 'no_records' | 'failed';
  connectivityStatus: 'not_checked' | 'reachable' | 'unreachable';
  message: string;
}
