import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';

interface Features {
  [FEATURE_KEY.PROXY_POSTGREST]: FeatureConfig;
  [FEATURE_KEY.VIEW_TABLES]: FeatureConfig;
  [FEATURE_KEY.VIEW_TABLE]: FeatureConfig;
  [FEATURE_KEY.CREATE_TABLE]: FeatureConfig;
  [FEATURE_KEY.RENAME_TABLE]: FeatureConfig;
  [FEATURE_KEY.DROP_TABLE]: FeatureConfig;
  [FEATURE_KEY.ADD_COLUMN]: FeatureConfig;
  [FEATURE_KEY.DROP_COLUMN]: FeatureConfig;
  [FEATURE_KEY.BULK_UPLOAD]: FeatureConfig;
  [FEATURE_KEY.JOIN_TABLES]: FeatureConfig;
  [FEATURE_KEY.EDIT_COLUMN]: FeatureConfig;
  [FEATURE_KEY.ADD_FOREIGN_KEY]: FeatureConfig;
  [FEATURE_KEY.UPDATE_FOREIGN_KEY]: FeatureConfig;
  [FEATURE_KEY.DELETE_FOREIGN_KEY]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.TOOLJET_DATABASE]: Features;
}
