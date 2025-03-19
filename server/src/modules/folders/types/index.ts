import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
interface Features {
  [FEATURE_KEY.CREATE_FOLDER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_FOLDER]: FeatureConfig;
  [FEATURE_KEY.DELETE_FOLDER]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FOLDER]: Features;
}
