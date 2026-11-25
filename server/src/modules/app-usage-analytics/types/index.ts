import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';

type Features = Record<FEATURE_KEY, FeatureConfig>;

export interface FeaturesConfig {
  [MODULES.APP_USAGE_ANALYTICS]: Features;
}

/** Payload of APP_OPENED_EVENT and of each queued job (Segment `track` shape). */
export interface AppOpenedEvent {
  event: 'app_opened';
  userId: string;
  /** ISO-8601, set on the server. */
  timestamp: string;
  properties: {
    workspaceId: string;
    appId: string;
    appVersionId: string;
    environment: 'production';
  };
}
