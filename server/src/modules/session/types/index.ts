import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { MODULES } from '@modules/app/constants/modules';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';

export type JWTPayload = {
  sessionId: string;
  username: string;
  sub: string;
  organizationId?: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  invitedOrganizationId?: string;
  isPATLogin?: boolean;
  token?: string;
  appId?: string;
  /* Which KIND of token minted this session. isPATLogin marks any PAT session; appId says it is
     pinned to one app. Neither alone identifies the session kind — see PatScopeInterceptor. */
  patScope?: PersonalAccessTokenScope;
  tj_api_source?: string;
};

interface Features {
  [FEATURE_KEY.LOG_OUT]: FeatureConfig;
  [FEATURE_KEY.GET_INVITED_USER_SESSION]: FeatureConfig;
  [FEATURE_KEY.GET_USER_SESSION]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.SESSION]: Features;
}
