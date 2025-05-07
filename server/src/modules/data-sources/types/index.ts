import { FEATURE_KEY } from '../constants';
import { FeatureConfig } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { QueryError, OAuthUnauthorizedClientError } from '@tooljet/plugins/dist/server';

interface Features {
  [FEATURE_KEY.GET]: FeatureConfig;
  [FEATURE_KEY.CREATE]: FeatureConfig;
  [FEATURE_KEY.UPDATE]: FeatureConfig;
  [FEATURE_KEY.DELETE]: FeatureConfig;
  [FEATURE_KEY.GET_BY_ENVIRONMENT]: FeatureConfig;
  [FEATURE_KEY.TEST_CONNECTION]: FeatureConfig;
  [FEATURE_KEY.SCOPE_CHANGE]: FeatureConfig;
  [FEATURE_KEY.GET_OAUTH2_BASE_URL]: FeatureConfig;
  [FEATURE_KEY.AUTHORIZE]: FeatureConfig;
  [FEATURE_KEY.GET_FOR_APP]: FeatureConfig;
  [FEATURE_KEY.QUERIES_LINKED_TO_DATASOURCE]: FeatureConfig;
}

export interface FeaturesConfig {
  [MODULES.GLOBAL_DATA_SOURCE]: Features;
}

type ConnectionTestResult = {
  status: 'ok' | 'failed';
  message?: string;
  data?: object;
};

type QueryResult = {
  status: 'ok' | 'failed' | 'needs_oauth';
  errorMessage?: string;
  data: Array<object> | object;
};

export interface QueryService {
  run(
    sourceOptions: object,
    queryOptions: object,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<QueryResult>;
  getConnection?(queryOptions: object, options: any, checkCache: boolean, dataSourceId: string): Promise<object>;
  testConnection?(sourceOptions: object): Promise<ConnectionTestResult>;
}

export { QueryError, OAuthUnauthorizedClientError };

export interface GetQueryVariables {
  appVersionId?: string;
  environmentId?: string;
}

export interface UpdateOptions {
  dataSourceId: string;
  environmentId: string;
}
