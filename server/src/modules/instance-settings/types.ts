import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY, INSTANCE_SYSTEM_SETTINGS } from './constants';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.INSTANCE_SETTINGS]: Features;
}

export type UpdateSystemSettingsDto = Partial<{
  [key in keyof typeof INSTANCE_SYSTEM_SETTINGS]: any;
}>;
