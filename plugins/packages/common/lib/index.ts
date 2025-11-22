import { QueryError, OAuthUnauthorizedClientError } from './query.error.js';
import { QueryResult } from './query_result.type.js';
import { User } from './user.type.js';
import { App } from './app.type.js';
import { QueryService } from './query_service.interface.js';
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
} from './utils.helper.js';
import { ConnectionTestResult } from './connection_test_result.type.js';
import {
  getRefreshedToken,
  getAuthUrl,
  sanitizeParams,
  checkIfContentTypeIsURLenc,
  checkIfContentTypeIsMultipartFormData,
  checkIfContentTypeIsJson,
  validateAndSetRequestOptionsBasedOnAuthType,
} from './oauth.js';

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
