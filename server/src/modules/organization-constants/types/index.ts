import { FEATURE_KEY, OrganizationConstantType } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.GET_PUBLIC]: FeatureConfig;
  [FEATURE_KEY.GET_FROM_APP]: FeatureConfig;
  [FEATURE_KEY.GET_FROM_ENVIRONMENT]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET_SECRETS]: FeatureConfig;
  [FEATURE_KEY.GET_DECRYPTED_CONSTANTS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATION_CONSTANT]: Features;
}

export interface ConstantEnvironmentValue {
  environmentName: string;
  value: string;
  id?: string;
}

// Response row of allEnvironmentConstants. `fromEnv` marks constants read from server environment variables.
export interface ConstantWithEnvironmentValues {
  id: string;
  name: string;
  type: OrganizationConstantType;
  createdAt: Date | string;
  values: ConstantEnvironmentValue[];
  fromEnv?: boolean;
}
