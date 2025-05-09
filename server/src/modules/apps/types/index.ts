import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ICON]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS]: FeatureConfig;
  [FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS]: FeatureConfig;
  [FEATURE_KEY.GET_ASSOCIATED_TABLES]: FeatureConfig;
  [FEATURE_KEY.GET_ONE]: FeatureConfig;
  [FEATURE_KEY.GET_BY_SLUG]: FeatureConfig;
  [FEATURE_KEY.RELEASE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.APP]: Features;
}

export interface AppResourceMappings {
  dataQueryMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
}

export interface SessionAppData {
  organizationId: string;
  isPublic: boolean;
  isReleased: boolean;
}
