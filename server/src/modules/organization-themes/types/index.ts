import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.THEMES_CREATE]: FeatureConfig;
  [FEATURE_KEY.THEMES_DELETE]: FeatureConfig;
  [FEATURE_KEY.THEMES_GET_ALL]: FeatureConfig;
  [FEATURE_KEY.THEMES_UPDATE_DEFAULT]: FeatureConfig;
  [FEATURE_KEY.THEMES_UPDATE_DEFINITION]: FeatureConfig;
  [FEATURE_KEY.THEMES_UPDATE_NAME]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.ORGANIZATION_THEMES]: Features;
}
export { FEATURE_KEY };
