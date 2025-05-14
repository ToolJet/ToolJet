import { FEATURE_KEY } from './index';
import { FeaturesConfig } from '../type';
import { MODULES } from '@modules/app/constants/modules';

export const FEATURES: FeaturesConfig = {
  [MODULES.TOOLJET_DATABASE]: {
    [FEATURE_KEY.PROXY_POSTGREST]: {},
    [FEATURE_KEY.VIEW_TABLES]: {},
    [FEATURE_KEY.VIEW_TABLE]: {},
    [FEATURE_KEY.CREATE_TABLE]: {},
    [FEATURE_KEY.RENAME_TABLE]: {},
    [FEATURE_KEY.DROP_TABLE]: {},
    [FEATURE_KEY.ADD_COLUMN]: {},
    [FEATURE_KEY.DROP_COLUMN]: {},
    [FEATURE_KEY.BULK_UPLOAD]: {},
    [FEATURE_KEY.JOIN_TABLES]: {},
    [FEATURE_KEY.EDIT_COLUMN]: {},
    [FEATURE_KEY.ADD_FOREIGN_KEY]: {},
    [FEATURE_KEY.UPDATE_FOREIGN_KEY]: {},
    [FEATURE_KEY.DELETE_FOREIGN_KEY]: {},
  },
};
