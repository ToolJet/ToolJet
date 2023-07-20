import { QueryError } from 'src/modules/data_sources/query.errors';
import * as sanitizeHtml from 'sanitize-html';
import { EntityManager, getManager } from 'typeorm';
import { isEmpty } from 'lodash';
const protobuf = require('protobufjs');
import { ConflictException } from '@nestjs/common';
import { DataBaseConstraints } from './db_constraints.constants';

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

export const defaultAppEnvironments = [{ name: 'production', isDefault: true, priority: 3 }];
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

export class MigrationProgress {
  private progress = 0;
  constructor(private fileName: string, private totalCount: number) {}

  show() {
    this.progress++;
    console.log(`${this.fileName} Progress ${Math.round((this.progress / this.totalCount) * 100)} %`);
  }
}
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
