import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_FOLDERS]: FeatureConfig;
  [FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE]: FeatureConfig;
  [FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FOLDER_DATA_SOURCES]: Features;
}
