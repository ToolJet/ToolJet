import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_DS_FOLDER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_DS_FOLDER]: FeatureConfig;
  [FEATURE_KEY.DELETE_DS_FOLDER]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FOLDER_DATA_SOURCES]: Features;
}
