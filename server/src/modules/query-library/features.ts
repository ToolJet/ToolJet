import { LICENSE_FIELD } from '@modules/licensing/constants';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureConfig } from '@modules/app/types';
import { FEATURE_KEY } from './constants';
export const FEATURES: { [MODULES.QUERY_LIBRARY]: Record<FEATURE_KEY, FeatureConfig> } = {
  [MODULES.QUERY_LIBRARY]: Object.fromEntries(
    Object.values(FEATURE_KEY).map((key) => [key, { license: LICENSE_FIELD.QUERY_LIBRARY }])
  ) as Record<FEATURE_KEY, FeatureConfig>,
};
