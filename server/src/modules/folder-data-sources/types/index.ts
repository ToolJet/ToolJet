import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_DATA_SOURCE_FOLDER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_DATA_SOURCE_FOLDER]: FeatureConfig;
  [FEATURE_KEY.DELETE_DATA_SOURCE_FOLDER]: FeatureConfig;
  [FEATURE_KEY.ADD_DATA_SOURCE_TO_FOLDER]: FeatureConfig;
  [FEATURE_KEY.REMOVE_DATA_SOURCE_FROM_FOLDER]: FeatureConfig;
  [FEATURE_KEY.BULK_MOVE_DATA_SOURCES]: FeatureConfig;
  [FEATURE_KEY.GET_DATA_SOURCE_FOLDERS]: FeatureConfig;
  [FEATURE_KEY.GET_DATA_SOURCES_IN_FOLDER]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FOLDER_DATA_SOURCES]: Features;
}
