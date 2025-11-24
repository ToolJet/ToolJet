import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '@modules/organization-payments/types';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATION_PAYMENTS]: {
    [FEATURE_KEY.CREATE_PORTAL_LINK]: {},
    [FEATURE_KEY.GET_CURRENT_PLAN_DETAILS]: {},
    [FEATURE_KEY.GET_PRORATION]: {},
    [FEATURE_KEY.GET_REDIRECT_URL]: {},
    [FEATURE_KEY.GET_UPCOMING_INVOICE]: {},
    [FEATURE_KEY.STRIPE_WEBHOOK]: {
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_INVOICE]: {},
    [FEATURE_KEY.UPDATE_SUBSCRIPTION]: {},
  },
};
