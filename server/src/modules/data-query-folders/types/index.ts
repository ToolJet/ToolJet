import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';

export enum ChildType {
  QUERY = 'query',
  FOLDER = 'folder',
}

export enum DeleteMode {
  FOLDER_ONLY = 'folder_only',
  FOLDER_AND_QUERIES = 'folder_and_queries',
}

interface Features {
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.REORDER]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.DATA_QUERY_FOLDERS]: Features;
}
