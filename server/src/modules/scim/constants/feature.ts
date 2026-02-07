import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { FEATURE_KEY } from '.';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.SCIM]: {
    [FEATURE_KEY.GET_ALL_USERS]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_USER]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_USER]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_USER]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.PATCH_USER]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_ALL_GROUPS]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_GROUP]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.CREATE_GROUP]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.UPDATE_GROUP]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.PATCH_GROUP]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_SP_CONFIG]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_RESOURCE_TYPES]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_SCHEMAS]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.GET_SCHEMA]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_USER]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
    [FEATURE_KEY.DELETE_GROUP]: {
      license: LICENSE_FIELD.SCIM,
      isPublic: true,
    },
  },
};
