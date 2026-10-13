import { FEATURE_KEY } from './index';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';

export const FEATURES: FeaturesConfig = {
  [MODULES.GLOBAL_DATA_SOURCE]: {
    [FEATURE_KEY.GET]: {},
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'DATA_SOURCE_CREATE',
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'DATA_SOURCE_UPDATE',
    },
    [FEATURE_KEY.DELETE]: {
      auditLogsKey: 'DATA_SOURCE_DELETE',
    },
    [FEATURE_KEY.GET_BY_ENVIRONMENT]: {},
    [FEATURE_KEY.TEST_CONNECTION]: {},
    [FEATURE_KEY.TEST_CONNECTION_SAMPLE_DB]: {},
    [FEATURE_KEY.SCOPE_CHANGE]: {},
    [FEATURE_KEY.GET_OAUTH2_BASE_URL]: {},
    [FEATURE_KEY.AUTHORIZE]: {},
    [FEATURE_KEY.GET_FOR_APP]: {
      shouldNotSkipPublicApp: true,
    },
    [FEATURE_KEY.QUERIES_LINKED_TO_DATASOURCE]: {},
    [FEATURE_KEY.QUERIES_DATASOURCE_LINKED_TO_MARKETPLACE_PLUGIN]: {},
    [FEATURE_KEY.VALIDATE_OPTIONS]: {},
    [FEATURE_KEY.OPENAPI_SPEC_CREATE]: {
      auditLogsKey: 'OPENAPI_SPEC_CREATE',
    },
    [FEATURE_KEY.OPENAPI_SPEC_CANCEL]: {
      auditLogsKey: 'OPENAPI_SPEC_CANCEL',
    },
    [FEATURE_KEY.OPENAPI_SPEC_GET_STATUS]: {},
    [FEATURE_KEY.OPENAPI_SPEC_GET_METADATA]: {},
    [FEATURE_KEY.OPENAPI_SPEC_LIST_OPERATIONS]: {},
    [FEATURE_KEY.OPENAPI_SPEC_GET_OPERATION]: {},
  },
};
