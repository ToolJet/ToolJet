import { QueryError, OAuthUnauthorizedClientError } from './query.error';
import { QueryResult } from './query_result.type';
import { QueryService } from './query_service.interface';
import {
  cacheConnection,
  getCachedConnection,
  parseJson,
  cleanSensitiveData,
  redactHeaders,
  getCurrentToken,
  sanitizeHeaders,
  sanitizeCookies,
  cookiesToString,
  sanitizeSearchParams,
  fetchHttpsCertsForCustomCA,
  sanitizeSortPairs,
  fromEntries,
} from './utils.helper';
import { ConnectionTestResult } from './connection_test_result.type';
import { User, App } from './types';
import {
  getRefreshedToken,
  getAuthUrl,
  sanitizeParams,
  validateAndSetRequestOptionsBasedOnAuthType,
  initializeOAuth,
} from './oauth';

export {
  QueryError,
  OAuthUnauthorizedClientError,
  QueryResult,
  QueryService,
  cacheConnection,
  getCachedConnection,
  parseJson,
  ConnectionTestResult,
  User,
  App,
  cleanSensitiveData,
  getCurrentToken,
  getRefreshedToken,
  getAuthUrl,
  sanitizeParams,
  sanitizeHeaders,
  sanitizeCookies,
  sanitizeSearchParams,
  validateAndSetRequestOptionsBasedOnAuthType,
  fetchHttpsCertsForCustomCA,
  redactHeaders,
  cookiesToString,
  sanitizeSortPairs,
  fromEntries,
  initializeOAuth,
};
