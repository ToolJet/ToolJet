import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.FOLDER_DATA_SOURCES]: {
    [FEATURE_KEY.CREATE_DATA_SOURCE_FOLDER]: {},
    [FEATURE_KEY.UPDATE_DATA_SOURCE_FOLDER]: {},
    [FEATURE_KEY.DELETE_DATA_SOURCE_FOLDER]: {},
    [FEATURE_KEY.ADD_DATA_SOURCE_TO_FOLDER]: {},
    [FEATURE_KEY.REMOVE_DATA_SOURCE_FROM_FOLDER]: {},
    [FEATURE_KEY.BULK_MOVE_DATA_SOURCES]: {},
    [FEATURE_KEY.GET_DATA_SOURCE_FOLDERS]: {},
    [FEATURE_KEY.GET_DATA_SOURCES_IN_FOLDER]: {},
  },
};
