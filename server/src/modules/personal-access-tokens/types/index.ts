import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_PAT]: FeatureConfig;
  [FEATURE_KEY.LIST_PATS]: FeatureConfig;
  [FEATURE_KEY.DELETE_PAT]: FeatureConfig;
  [FEATURE_KEY.VALIDATE_PAT]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.PERSONAL_ACCESS_TOKENS]: Features;
}
