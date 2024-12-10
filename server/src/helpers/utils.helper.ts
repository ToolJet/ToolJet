import { QueryError } from 'src/modules/data_sources/query.errors';
import * as sanitizeHtml from 'sanitize-html';
import { EntityManager } from 'typeorm';
import { isEmpty } from 'lodash';
import { ConflictException } from '@nestjs/common';
import { DataBaseConstraints } from './db_constraints.constants';
import { LICENSE_LIMIT } from '@licensing/helper';
const protobuf = require('protobufjs');
const semver = require('semver');

export function maybeSetSubPath(path) {
  const hasSubPath = process.env.SUB_PATH !== undefined;
  const urlPrefix = hasSubPath ? process.env.SUB_PATH : '';

  if (isEmpty(urlPrefix)) {
    return path;
  }

  const pathWithoutLeadingSlash = path.replace(/^\/+/, '');
  return urlPrefix + pathWithoutLeadingSlash;
}

export function parseJson(jsonString: string, errorMessage?: string): object {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    throw new QueryError(errorMessage, err.message, {});
  }
}

export async function cacheConnection(dataSourceId: string, connection: any): Promise<any> {
  const updatedAt = new Date();
  globalThis.CACHED_CONNECTIONS[dataSourceId] = { connection, updatedAt };
}

export async function getCachedConnection(dataSourceId, dataSourceUpdatedAt): Promise<any> {
  const cachedData = globalThis.CACHED_CONNECTIONS[dataSourceId] || {};

  if (cachedData) {
    const updatedAt = new Date(dataSourceUpdatedAt || null);
    const cachedAt = new Date(cachedData.updatedAt || null);

    const diffTime = (cachedAt.getTime() - updatedAt.getTime()) / 1000;

    if (diffTime < 0) {
      return null;
    } else {
      return cachedData['connection'];
    }
  }
}

export function cleanObject(obj: any): any {
  // This will remove undefined properties, for self and its children
  Object.keys(obj).forEach((key) => {
    obj[key] === undefined && delete obj[key];
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      cleanObject(obj[key]);
    }
  });
}

export function sanitizeInput(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}

export function isJSONString(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

export function formatTimestamp(value: any, params: any) {
  const { data_type } = params;
  if (data_type === 'timestamp with time zone' && value) {
    return `'${value}'`;
  }
  return value;
}

/**
 * Since for JSONB column the default value must be in stringify format, if the input has single quotes we would need to escape the single quotes.
 * @param input - Default value of JSONB column.
 * @returns - Sanitized input by escaping single quotes in the input.
 */
function escapeSingleQuotesInDefaultValueForJSONB(input) {
  if (typeof input === 'string') {
    return input.replace(/'/g, "''");
  } else if (input.length && Array.isArray(input)) {
    return input.map(escapeSingleQuotesInDefaultValueForJSONB);
  } else if (!Array.isArray(input) && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, escapeSingleQuotesInDefaultValueForJSONB(value)])
    );
  }
  return input;
}

/**
 * Formats default value passed to JSONB column into a stringify format.
 * @param value Default value for a JSONB column.
 * @returns Stringify default value.
 */
export function formatJSONB(value: any, params: any) {
  const { data_type } = params;
  if (data_type === 'jsonb' && value) {
    const jsonString = JSON.stringify(escapeSingleQuotesInDefaultValueForJSONB(value));
    return `'${jsonString}'`;
  }
  return value;
}

export function formatJoinsJSONBPath(jsonpath: string): string {
  const addedQuotesToColumnName = jsonpath.replace(/(->>|->|'[^']*'|\w+)/g, (match) => {
    return /->/.test(match) || /^'.*'$/.test(match) ? match : `'${match}'`;
  });
  return addedQuotesToColumnName;
}

export function lowercaseString(value: string) {
  return value?.toLowerCase()?.trim();
}

export const updateTimestampForAppVersion = async (manager, appVersionId) => {
  const appVersion = await manager.findOne('app_versions', {
    where: { id: appVersionId },
  });
  if (appVersion) {
    await manager.update('app_versions', appVersionId, { updatedAt: new Date() });
  }
};

type DbContraintAndMsg = {
  dbConstraint: DataBaseConstraints;
  message: string;
};

export async function catchDbException(operation: () => any, dbConstraints: DbContraintAndMsg[]): Promise<any> {
  try {
    return await operation();
  } catch (err) {
    dbConstraints.map((dbConstraint) => {
      if (err?.message?.includes(dbConstraint.dbConstraint)) {
        throw new ConflictException(dbConstraint.message);
      }
    });

    throw err;
  }
}

export const defaultAppEnvironments = [{ name: 'production', isDefault: true, priority: 3 }];

export function isPlural(data: Array<any>) {
  return data?.length > 1 ? 's' : '';
}

export function validateDefaultValue(value: any, params: any) {
  const { data_type } = params;
  if (data_type === 'boolean') return value || 'false';
  return value;
}

export async function dropForeignKey(tableName: string, columnName: string, queryRunner) {
  const table = await queryRunner.getTable(tableName);
  const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf(columnName) !== -1);
  await queryRunner.dropForeignKey(tableName, foreignKey);
}

export async function getServiceAndRpcNames(protoDefinition) {
  const root = protobuf.parse(protoDefinition).root;
  const serviceNamesAndMethods = root.nestedArray
    .filter((item) => item instanceof protobuf.Service)
    .reduce((acc, service) => {
      const rpcMethods = service.methodsArray.map((method) => method.name);
      acc[service.name] = rpcMethods;
      return acc;
    }, {});
  return serviceNamesAndMethods;
}

export function generatePayloadForLimits(currentCount: number, totalCount: any, licenseStatus: object, label?: string) {
  return totalCount !== LICENSE_LIMIT.UNLIMITED
    ? {
        percentage: (currentCount / totalCount) * 100,
        total: totalCount,
        current: currentCount,
        licenseStatus,
        label,
        canAddUnlimited: false,
      }
    : {
        canAddUnlimited: true,
        licenseStatus,
        label,
      };
}
export class MigrationProgress {
  private progress = 0;
  constructor(private fileName: string, private totalCount: number) {}

  show() {
    this.progress++;
    console.log(`${this.fileName} Progress ${Math.round((this.progress / this.totalCount) * 100)} %`);
  }
}

export const processDataInBatches = async <T>(
  entityManager: EntityManager,
  getData: (entityManager: EntityManager, skip: number, take: number) => Promise<T[]>,
  processBatch: (entityManager: EntityManager, data: T[]) => Promise<void>,
  batchSize = 1000
): Promise<void> => {
  let skip = 0;
  let data: T[];

  do {
    data = await getData(entityManager, skip, batchSize);
    skip += batchSize;

    if (data.length > 0) {
      await processBatch(entityManager, data);
    }
  } while (data.length === batchSize);
};

export const generateNextNameAndSlug = (firstWord: string) => {
  firstWord = firstWord.length > 35 ? firstWord.slice(0, 35) : firstWord;
  const name = `${firstWord} ${Date.now()}`;
  const slug = generateWorkspaceSlug(name);
  return {
    name,
    slug,
  };
};

export function generateWorkspaceSlug(workspaceName: string): string {
  return workspaceName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const truncateAndReplace = (name) => {
  const secondsSinceEpoch = Date.now();
  if (name.length > 35) {
    return name.replace(name.substring(35, 50), secondsSinceEpoch);
  }
  return name + secondsSinceEpoch;
};

export const generateInviteURL = (
  invitationToken: string,
  organizationToken?: string,
  organizationId?: string,
  source?: string,
  redirectTo?: string
) => {
  const host = process.env.TOOLJET_HOST;
  const subpath = process.env.SUB_PATH;
  const baseURL = `${host}${subpath ? subpath : '/'}`;
  const inviteSupath = `invitations/${invitationToken}`;
  const organizationSupath = `${organizationToken ? `/workspaces/${organizationToken}` : ''}`;
  let queryString = new URLSearchParams({
    ...(organizationId && { oid: organizationId }),
    ...(source && { source }),
    ...(redirectTo && { redirectTo }),
  }).toString();
  queryString = queryString ? `?${queryString}` : '';
  return `${baseURL}${inviteSupath}${organizationSupath}${queryString}`;
};

export const generateOrgInviteURL = (
  organizationToken: string,
  organizationId?: string,
  fullUrl = true,
  redirectTo?: string
) => {
  const host = process.env.TOOLJET_HOST;
  const subpath = process.env.SUB_PATH;
  return `${fullUrl ? `${host}${subpath ? subpath : '/'}` : '/'}organization-invitations/${organizationToken}${
    organizationId ? `?oid=${organizationId}` : ''
  }${redirectTo ? `&redirectTo=${redirectTo}` : ''}`;
};

export function extractMajorVersion(version) {
  return semver.valid(semver.coerce(version));
}

export function checkVersionCompatibility(importingVersion) {
  return semver.gte(semver.coerce(globalThis.TOOLJET_VERSION), semver.coerce(importingVersion));
}

/**
 * Checks if a given Tooljet version is compatible with normalized app definition schemas.
 *
 * This function uses the 'semver' library to compare the provided version with a minimum version requirement
 * for normalized app definition schemas (2.24.1). It returns true if the version is greater than or equal to
 * the required version, indicating compatibility.
 *
 * @param {string} version - The Tooljet version to check.
 * @returns {boolean} - True if the version is compatible, false otherwise.
 */
export function isTooljetVersionWithNormalizedAppDefinitionSchem(version) {
  return semver.satisfies(semver.coerce(version), '>= 2.24.0');
}

function parseVersion(version: string): number[] {
  return version.split('-')[0].split('.').map(Number);
}

/**
 * Compares two version strings and determines if the first version is greater than the second.
 *
 * @param {string} version1 - The first version string to compare.
 * @param {string} version2 - The second version string to compare.
 * @returns {boolean} True if version1 is greater than version2, false otherwise.
 *
 * @example
 * isVersionGreaterThan('2.62.0-ee2.21.0', '2.28.4-ee2.15.0-cloud2.3.1'); // true
 * isVersionGreaterThan('2.50.1.1.1', '2.50.1.1.0'); // true
 * isVersionGreaterThan('2.62.0', '2.62.0-ee2.21.0'); // false (ignores text after hyphen)
 */
export function isVersionGreaterThan(version1: string, version2: string): boolean {
  if (!version1) return false;
  const v1Parts = parseVersion(version1);
  const v2Parts = parseVersion(version2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    if (v1Part > v2Part) {
      return true;
    } else if (v1Part < v2Part) {
      return false;
    }
  }
  return false;
}

/**
 * Compares two ToolJet version strings and determines if they are equal.
 *
 * @param {string} version1 - The first version string to compare.
 * @param {string} version2 - The second version string to compare.
 * @returns {boolean} True if version1 is equal to version2, false otherwise.
 *
 * @example
 * isVersionEqual('2.62.0-ee2.21.0', '2.62.0-ee2.21.0'); // true
 * isVersionEqual('2.50.1.1.1', '2.50.1.1.1'); // true
 * isVersionEqual('2.62.0', '2.62.0-ee2.21.0'); // true (ignores text after hyphen)
 */
export function isVersionEqual(version1: string, version2: string): boolean {
  if (!version1) return false;
  const v1Parts = parseVersion(version1);
  const v2Parts = parseVersion(version2);

  if (v1Parts.length !== v2Parts.length) return false;

  for (let i = 0; i < v1Parts.length; i++) {
    if (v1Parts[i] !== v2Parts[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two ToolJet version strings and determines if the first version is greater than or equal to the second.
 *
 * @param {string} version1 - The first version string to compare.
 * @param {string} version2 - The second version string to compare.
 * @returns {boolean} True if version1 is greater than or equal to version2, false otherwise.
 *
 * @example
 * isVersionGreaterThanOrEqual('2.62.0-ee2.21.0', '2.28.4-ee2.15.0-cloud2.3.1'); // true
 * isVersionGreaterThanOrEqual('2.50.1.1.1', '2.50.1.1.1'); // true
 * isVersionGreaterThanOrEqual('2.28.4-ee2.15.0-cloud2.3.1', '2.62.0-ee2.21.0'); // false
 */
export function isVersionGreaterThanOrEqual(version1: string, version2: string): boolean {
  return isVersionGreaterThan(version1, version2) || isVersionEqual(version1, version2);
}

export const getMaxCopyNumber = (existNameList, splitChar = '_') => {
  if (existNameList.length == 0) return '';
  const filteredNames = existNameList.filter((name) => {
    const parts = name.split(splitChar);
    return !isNaN(parseInt(parts[parts.length - 1]));
  });

  // Extracting numbers from the filtered names
  const numbers = filteredNames.map((name) => {
    const parts = name.split(splitChar);
    return parseInt(parts[parts.length - 1]);
  });

  // Finding the maximum number
  // Creating the new name with maxNumber + 1
  const maxNumber = Math.max(...numbers, 0);
  return maxNumber + 1;
};

export const fullName = (firstName: string, lastName: string) => `${firstName || ''}${lastName ? ` ${lastName}` : ''}`;

export const isValidDomain = (email: string, restrictedDomain: string): boolean => {
  if (!email) {
    return false;
  }
  const domain = email.substring(email.lastIndexOf('@') + 1);

  if (!restrictedDomain) {
    return true;
  }
  if (!domain) {
    return false;
  }
  if (
    !restrictedDomain
      .split(',')
      .map((e) => e && e.trim())
      .filter((e) => !!e)
      .includes(domain)
  ) {
    return false;
  }
  return true;
};

export const isHttpsEnabled = () => {
  return !!process.env.TOOLJET_HOST?.startsWith('https');
};

export function isObject(obj) {
  return obj && typeof obj === 'object';
}

export function mergeDeep(target, source, seen = new WeakMap()) {
  if (!isObject(target)) {
    target = {};
  }

  if (!isObject(source)) {
    return target;
  }

  if (seen.has(source)) {
    return seen.get(source);
  }
  seen.set(source, target);

  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      mergeDeep(target[key], source[key], seen);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }

  return target;
}
export const getSubpath = () => {
  const subpath = process.env.SUB_PATH || '';
  // Ensure subpath starts and ends with slashes
  if (subpath) {
    if (!subpath.startsWith('/') || !subpath.endsWith('/')) {
      throw new Error('SUB_PATH must start and end with a slash');
    }
  }
  return subpath;
};
