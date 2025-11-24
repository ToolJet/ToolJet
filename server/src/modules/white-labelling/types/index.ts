import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constant';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.GET_ORGANIZATION_WHITE_LABELS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.WHITE_LABELLING]: Features;
}
