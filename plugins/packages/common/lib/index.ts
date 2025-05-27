import { QueryError, OAuthUnauthorizedClientError } from './query.error';
import { QueryResult } from './query_result.type';
import { User } from './user.type';
import { App } from './app.type';
import { QueryService } from './query_service.interface';
import {
  isEmpty,
  cacheConnection,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
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
} from './utils.helper';
import { ConnectionTestResult } from './connection_test_result.type';
import {
  getRefreshedToken,
  getAuthUrl,
  sanitizeParams,
  checkIfContentTypeIsURLenc,
  checkIfContentTypeIsMultipartFormData,
  checkIfContentTypeIsJson,
  validateAndSetRequestOptionsBasedOnAuthType,
} from './oauth';

export {
  QueryError,
  OAuthUnauthorizedClientError,
  QueryResult,
  QueryService,
  User,
  App,
  cacheConnection,
  generateSourceOptionsHash,
  cacheConnectionWithConfiguration,
  getCachedConnection,
  parseJson,
  isEmpty,
  ConnectionTestResult,
  cleanSensitiveData,
  getCurrentToken,
  getRefreshedToken,
  getAuthUrl,
  sanitizeParams,
  sanitizeHeaders,
  sanitizeCookies,
  sanitizeSearchParams,
  checkIfContentTypeIsURLenc,
  checkIfContentTypeIsMultipartFormData,
  checkIfContentTypeIsJson,
  validateAndSetRequestOptionsBasedOnAuthType,
  fetchHttpsCertsForCustomCA,
  redactHeaders,
  cookiesToString,
  sanitizeSortPairs,
};
