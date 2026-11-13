import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';

interface Features {
  [FEATURE_KEY.GET_CODE_PAGE_SECURITY]: FeatureConfig;
  [FEATURE_KEY.UPDATE_CODE_PAGE_SECURITY]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.CODE_PAGE_SECURITY]: Features;
}
