import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.FOLDER_DATA_SOURCES]: {
    [FEATURE_KEY.GET_FOLDERS]: {},
    [FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE]: {},
    [FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE]: {},
  },
};
