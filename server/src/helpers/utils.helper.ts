import { QueryError } from 'src/modules/data_sources/query.errors';
import * as sanitizeHtml from 'sanitize-html';
import { EntityManager, getManager } from 'typeorm';
import { isEmpty } from 'lodash';
import { USER_TYPE } from './user_lifecycle';
import { EncryptionService } from '@services/encryption.service';
import { Credential } from 'src/entities/credential.entity';

export function parseJson(jsonString: string, errorMessage?: string): object {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    throw new QueryError(errorMessage, err.message, {});
  }
}
const protobuf = require('protobufjs');
import { ConflictException } from '@nestjs/common';
import { DataBaseConstraints } from './db_constraints.constants';
import { LICENSE_LIMIT } from './license.helper';

export function maybeSetSubPath(path) {
  const hasSubPath = process.env.SUB_PATH !== undefined;
  const urlPrefix = hasSubPath ? process.env.SUB_PATH : '';

  if (isEmpty(urlPrefix)) {
    return path;
  }

  const pathWithoutLeadingSlash = path.replace(/^\/+/, '');
  return urlPrefix + pathWithoutLeadingSlash;
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

export function lowercaseString(value: string) {
  return value?.toLowerCase()?.trim();
}

export async function dbTransactionWrap(operation: (...args) => any, manager?: EntityManager): Promise<any> {
  if (manager) {
    return await operation(manager);
  } else {
    return await getManager().transaction(async (manager) => {
      return await operation(manager);
    });
  }
}

export const retrieveWhiteLabelText = () => {
  return process.env?.WHITE_LABEL_TEXT ? process.env.WHITE_LABEL_TEXT : 'ToolJet';
};

export const defaultAppEnvironments = [
  { name: 'development', isDefault: false, priority: 1 },
  { name: 'staging', isDefault: false, priority: 2 },
  { name: 'production', isDefault: true, priority: 3 },
];

export const isSuperAdmin = (user) => {
  return !!(user?.userType === USER_TYPE.INSTANCE);
};
export async function catchDbException(
  operation: () => any,
  dbConstraint: DataBaseConstraints,
  errorMessage: string
): Promise<any> {
  try {
    return await operation();
  } catch (err) {
    if (err?.message?.includes(dbConstraint)) {
      throw new ConflictException(errorMessage);
    }
    throw err;
  }
}

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

function convertToArrayOfKeyValuePairs(options): Array<object> {
  if (!options) return;
  return Object.keys(options).map((key) => {
    return {
      key: key,
      value: options[key]['value'],
      encrypted: options[key]['encrypted'],
      credential_id: options[key]['credential_id'],
    };
  });
}

export async function filterEncryptedFromOptions(
  options: Array<object>,
  encryptionService: EncryptionService,
  entityManager: EntityManager
) {
  const kvOptions = convertToArrayOfKeyValuePairs(options);

  if (!kvOptions) return;

  const parsedOptions = {};

  for (const option of kvOptions) {
    if (option['encrypted']) {
      const credential = await createCredential('', encryptionService, entityManager);

      parsedOptions[option['key']] = {
        credential_id: credential.id,
        encrypted: option['encrypted'],
      };
    } else {
      parsedOptions[option['key']] = {
        value: option['value'],
        encrypted: false,
      };
    }
  }

  return parsedOptions;
}

async function createCredential(
  value: string,
  encryptionService: EncryptionService,
  entityManager: EntityManager
): Promise<Credential> {
  const credentialRepository = entityManager.getRepository(Credential);
  const newCredential = credentialRepository.create({
    valueCiphertext: await encryptionService.encryptColumnValue('credentials', 'value', value),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const credential = await credentialRepository.save(newCredential);
  return credential;
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

export const generateNextName = (firstWord: string) => {
  return `${firstWord} ${Date.now()}`;
};

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
  source?: string
) => {
  const host = process.env.TOOLJET_HOST;
  const subpath = process.env.SUB_PATH;

  return `${host}${subpath ? subpath : '/'}invitations/${invitationToken}${
    organizationToken ? `/workspaces/${organizationToken}${organizationId ? `?oid=${organizationId}` : ''}` : ''
  }${source ? `${organizationId ? '&' : '?'}source=${source}` : ''}`;
};

export const generateOrgInviteURL = (organizationToken: string, organizationId?: string) => {
  const host = process.env.TOOLJET_HOST;
  const subpath = process.env.SUB_PATH;
  return `${host}${subpath ? subpath : '/'}organization-invitations/${organizationToken}${
    organizationId ? `?oid=${organizationId}` : ''
  }`;
};
