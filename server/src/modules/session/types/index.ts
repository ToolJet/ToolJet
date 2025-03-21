import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';

export type JWTPayload = {
  sessionId: string;
  username: string;
  sub: string;
  organizationId?: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  invitedOrganizationId?: string;
};

interface Features {
  [FEATURE_KEY.LOG_OUT]: FeatureConfig;
  [FEATURE_KEY.GET_INVITED_USER_SESSION]: FeatureConfig;
  [FEATURE_KEY.GET_USER_SESSION]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SESSION]: Features;
}
