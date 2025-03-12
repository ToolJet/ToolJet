import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.CLONE_PAGES]: FeatureConfig;
  [FEATURE_KEY.REORDER_PAGES]: FeatureConfig;
  [FEATURE_KEY.UPDATE_PAGES]: FeatureConfig;
  [FEATURE_KEY.DELETE_PAGE]: FeatureConfig;
  [FEATURE_KEY.CREATE_PAGES]: FeatureConfig;
  [FEATURE_KEY.CREATE_EVENT]: FeatureConfig;
  [FEATURE_KEY.GET_EVENTS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_EVENT]: FeatureConfig;
  [FEATURE_KEY.DELETE_EVENT]: FeatureConfig;
  [FEATURE_KEY.CREATE_COMPONENTS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_COMPONENTS]: FeatureConfig;
  [FEATURE_KEY.UPDATE_COMPONENT_LAYOUT]: FeatureConfig;
  [FEATURE_KEY.DELETE_COMPONENTS]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.GET_ONE]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE_SETTINGS]: FeatureConfig;
  [FEATURE_KEY.PROMOTE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.VERSION]: Features;
}
