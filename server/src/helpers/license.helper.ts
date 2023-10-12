import { Terms } from '@ee/licensing/types';
import { readFileSync } from 'fs';
import { publicDecrypt } from 'crypto';
import { resolve } from 'path';
import { inflateSync } from 'zlib';

export enum LICENSE_FIELD {
  IS_EXPIRED = 'expired',
  APP_COUNT = 'appCount',
  TABLE_COUNT = 'tableCount',
  TOTAL_USERS = 'usersCount',
  EDITORS = 'editorsCount',
  VIEWERS = 'viewersCount',
  OIDC = 'oidcEnabled',
  LDAP = 'ldapEnabled',
  SAML = 'samlEnabled',
  CUSTOM_STYLE = 'customStylingEnabled',
  WHITE_LABEL = 'whitelabellingEnabled',
  AUDIT_LOGS = 'auditLogsEnabled',
  MULTI_ENVIRONMENT = 'multiEnvironmentEnabled',
  UPDATED_AT = 'updatedAt',
  ALL = 'all',
  USER = 'allUsers',
  VALID = 'valid',
  WORKSPACES = 'workspaces',
  FEATURES = 'features',
  DOMAINS = 'domains',
  STATUS = 'status',
  META = 'metadata',
}

export enum LICENSE_LIMITS_LABEL {
  //Users
  USERS = 'Total Users',
  SUPERADMINS = 'Superadmins',
  EDIT_USERS = 'Builders',
  END_USERS = 'End Users',
  SUPERADMIN_USERS = 'Super Admins',

  //Apps
  APPS = 'Apps',

  //Workspaces
  WORKSPACES = 'Workspaces',

  //Tables
  TABLES = 'Tables',
}

export enum LICENSE_TYPE {
  BASIC = 'basic',
  TRIAL = 'trial',
  ENTERPRISE = 'enterprise',
}

export enum LICENSE_LIMIT {
  UNLIMITED = 'UNLIMITED',
}

export function decrypt(toDecrypt: string): Terms {
  const absolutePath = resolve('keys/public.pem');
  const publicKey = readFileSync(absolutePath, 'utf8');
  const buffer = Buffer.from(toDecrypt, 'base64');
  const decrypted = publicDecrypt(publicKey, buffer);

  const decryptedJson = JSON.parse(decrypted.toString('utf8'));

  if (decryptedJson?.version !== 2) {
    return decryptedJson;
  }
  return JSON.parse(inflateSync(Buffer.from(decryptedJson.data, 'base64')).toString('utf8'));
}

export const LICENSE_TRIAL_API = 'https://nlb.tooljet.com/api/license/trial';
