import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.CREATE_DS_FOLDER]: FeatureConfig;
  [FEATURE_KEY.UPDATE_DS_FOLDER]: FeatureConfig;
  [FEATURE_KEY.DELETE_DS_FOLDER]: FeatureConfig;
  [FEATURE_KEY.ADD_DS_TO_FOLDER]: FeatureConfig;
  [FEATURE_KEY.REMOVE_DS_FROM_FOLDER]: FeatureConfig;
  [FEATURE_KEY.BULK_MOVE_DS]: FeatureConfig;
  [FEATURE_KEY.GET_DS_FOLDERS]: FeatureConfig;
  [FEATURE_KEY.GET_DS_IN_FOLDER]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.FOLDER_DATA_SOURCES]: Features;
}
