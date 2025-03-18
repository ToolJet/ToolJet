import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

interface Features {
  [FEATURE_KEY.PING]: FeatureConfig;
  [FEATURE_KEY.FETCH_ZERO_STATE]: FeatureConfig;
  [FEATURE_KEY.SEND_USER_MESSAGE]: FeatureConfig;
  [FEATURE_KEY.SEND_DOCS_MESSAGE]: FeatureConfig;
  [FEATURE_KEY.APPROVE_PRD]: FeatureConfig;
  [FEATURE_KEY.REGENERATE_MESSAGE]: FeatureConfig;
  [FEATURE_KEY.VOTE_MESSAGE]: FeatureConfig;
  [FEATURE_KEY.GET_CREDITS_BALANCE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.AI]: Features;
}
