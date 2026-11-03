import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.APP_PERMISSIONS]: {
    [FEATURE_KEY.FETCH_USERS]: {},
    [FEATURE_KEY.FETCH_USER_GROUPS]: {},
    [FEATURE_KEY.FETCH_PAGE_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_PAGES,
    },
    // Public-app skip covers reads only; permission mutations keep the permission check.
    [FEATURE_KEY.CREATE_PAGE_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_PAGES,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE_PAGE_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_PAGES,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.DELETE_PAGE_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_PAGES,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.FETCH_QUERY_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_QUERY,
    },
    [FEATURE_KEY.CREATE_QUERY_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_QUERY,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE_QUERY_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_QUERY,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.DELETE_QUERY_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_QUERY,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.FETCH_COMPONENT_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
    },
    [FEATURE_KEY.CREATE_COMPONENT_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.UPDATE_COMPONENT_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.DELETE_COMPONENT_PERMISSIONS]: {
      license: LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
      shouldNotSkipPublicApp: true,
    },
  },
};
