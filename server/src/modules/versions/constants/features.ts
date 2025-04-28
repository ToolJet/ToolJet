import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.VERSION]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.GET_ONE]: {},
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.DELETE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.UPDATE_SETTINGS]: {
      auditLogsKey: 'APP_UPDATE',
    },
    [FEATURE_KEY.PROMOTE]: {
      license: LICENSE_FIELD.VALID,
    },
    [FEATURE_KEY.CREATE_COMPONENTS]: {},
    [FEATURE_KEY.UPDATE_COMPONENTS]: {},
    [FEATURE_KEY.UPDATE_COMPONENT_LAYOUT]: {},
    [FEATURE_KEY.DELETE_COMPONENTS]: {},
    [FEATURE_KEY.CREATE_PAGES]: {},
    [FEATURE_KEY.CLONE_PAGES]: {},
    [FEATURE_KEY.UPDATE_PAGES]: {},
    [FEATURE_KEY.DELETE_PAGE]: {},
    [FEATURE_KEY.REORDER_PAGES]: {},
    [FEATURE_KEY.GET_EVENTS]: {},
    [FEATURE_KEY.CREATE_EVENT]: {},
    [FEATURE_KEY.UPDATE_EVENT]: {},
    [FEATURE_KEY.DELETE_EVENT]: {},
  },
};
