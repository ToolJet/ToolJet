import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.FOLDER_DATA_SOURCES]: {
    [FEATURE_KEY.CREATE_DS_FOLDER]: {},
    [FEATURE_KEY.UPDATE_DS_FOLDER]: {},
    [FEATURE_KEY.DELETE_DS_FOLDER]: {},
  },
};
