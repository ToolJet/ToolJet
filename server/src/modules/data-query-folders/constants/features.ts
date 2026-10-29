import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

const tooljetEdition = getTooljetEdition();
const isEnterpriseEdition = tooljetEdition === TOOLJET_EDITIONS.EE || tooljetEdition === TOOLJET_EDITIONS.Cloud;

const licensedFeature = isEnterpriseEdition ? {} : { license: LICENSE_FIELD.QUERY_FOLDERS };

export const FEATURES: FeaturesConfig = {
  [MODULES.DATA_QUERY_FOLDERS]: {
    [FEATURE_KEY.CREATE]: licensedFeature,
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.UPDATE]: licensedFeature,
    [FEATURE_KEY.DELETE]: licensedFeature,
    [FEATURE_KEY.REORDER]: licensedFeature,
  },
};
