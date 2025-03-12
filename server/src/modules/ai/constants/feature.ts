import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.AI]: {
    [FEATURE_KEY.PING]: {
      isPublic: true,
    },
    [FEATURE_KEY.FETCH_ZERO_STATE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.SEND_USER_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.SEND_DOCS_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.APPROVE_PRD]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.REGENERATE_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.VOTE_MESSAGE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
    [FEATURE_KEY.GET_CREDITS_BALANCE]: {
      license: LICENSE_FIELD.AI_FEATURE,
    },
  },
};
