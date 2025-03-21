import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.GET_ONE]: FeatureConfig;
  [FEATURE_KEY.INSTALL]: FeatureConfig;
  [FEATURE_KEY.RELOAD]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DEPENDENTPLUGINS]: FeatureConfig;
  [FEATURE_KEY.INSTALL_DEPENDENT_PLUGINS]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.PLUGINS]: Features;
}
