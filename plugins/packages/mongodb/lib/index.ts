import { QueryResult, QueryService, QueryError, ConnectionTestResult } from '@tooljet-plugins/common';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import { SourceOptions, QueryOptions } from './types';
import tls from 'tls';

export default class MongodbService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'list_collections':
          result = await db.listCollections().toArray();
          break;
         case 'create_collection':
          const collection = await db.createCollection(queryOptions.collection, this.parseEJSON(queryOptions.options));
          result = {
            collectionName: collection.collectionName,
            namespace: collection.namespace,
            options: collection.options,
          };
          break;
        case 'insert_one':
          result = await db
            .collection(queryOptions.collection)
            .insertOne(this.parseEJSON(queryOptions.document), this.parseEJSON(queryOptions.options));
          break;
        case 'insert_many':
          result = await db
            .collection(queryOptions.collection)
            .insertMany(this.parseEJSON(queryOptions.documents), this.parseEJSON(queryOptions.options));
          break;
        case 'find_one':
          result = await db
            .collection(queryOptions.collection)
            .findOne(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'find_many':
          result = await db
            .collection(queryOptions.collection)
            .find(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options))
            .toArray();
          break;
        case 'count_total':
          result = await db
            .collection(queryOptions.collection)
            .estimatedDocumentCount(this.parseEJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'count':
          result = await db
            .collection(queryOptions.collection)
            .countDocuments(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'distinct':
          result = await db
            .collection(queryOptions.collection)
            .distinct(queryOptions.field, this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'update_one':
          result = await db
            .collection(queryOptions.collection)
            .updateOne(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'update_many':
          result = await db
            .collection(queryOptions.collection)
            .updateMany(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'replace_one':
          result = await db
            .collection(queryOptions.collection)
            .replaceOne(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.replacement),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_replace':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndReplace(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.replacement),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_update':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndUpdate(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_delete':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndDelete(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'delete_one':
          result = await db
            .collection(queryOptions.collection)
            .deleteOne(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'delete_many':
          result = await db
            .collection(queryOptions.collection)
            .deleteMany(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'bulk_write':
          result = await db
            .collection(queryOptions.collection)
            .bulkWrite(this.parseEJSON(queryOptions.operations), this.parseEJSON(queryOptions.options));
          break;
        case 'aggregate':
          result = await db
            .collection(queryOptions.collection)
            .aggregate(this.parseEJSON(queryOptions.pipeline), this.parseEJSON(queryOptions.options))
            .toArray();
          break;
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = {
          name: error.name,
          code: (error as any).code || null,
          codeName: (error as any).codeName || null,
          keyPattern: (error as any).keyPattern || null,
          keyValue: (error as any).keyValue || null,
        };
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      await close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const { db, close } = await this.getConnection(sourceOptions);

    try {
      const collections = await db.listCollections().toArray();

      const result = collections.map((col) => ({
        collection_name: col.name,
        type: col.type || 'collection',
      }));

      return {
        status: 'ok',
        data: result,
      };
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch collections', errorMessage, {});
    } finally {
      await close();
    }
  }

  parseEJSON(maybeEJSON?: string): any {
    if (!maybeEJSON) return {};

    return EJSON.parse(JSON.stringify(JSON5.parse(maybeEJSON)));
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    await db.listCollections().toArray();
    await close();

    return {
      status: 'ok',
    };
  }

async getConnection(sourceOptions: SourceOptions): Promise<any> {
  let db = null;
  let client;
  const connectionType = sourceOptions['connection_type'];

  if (connectionType === 'manual') {
    const format = sourceOptions.connection_format || 'mongodb';
    const database = sourceOptions.database;
    const host = sourceOptions.host;
    const port = sourceOptions.port || undefined;
    const username = encodeURIComponent(sourceOptions.username);
    const password = encodeURIComponent(sourceOptions.password);

    const needsAuthentication = username !== '' && password !== '';
    let uri = '';

    if (format === 'mongodb') {
      uri = needsAuthentication
        ? `mongodb://${username}:${password}@${host}:${port}`
        : `mongodb://${host}:${port}`;
    } else {
      uri = needsAuthentication
        ? `mongodb+srv://${username}:${password}@${host}`
        : `mongodb+srv://${host}`;
    }

    let clientOptions = {};

    if (sourceOptions.tls_certificate === 'client_certificate') {
      const secureContext = tls.createSecureContext({
        ca: sourceOptions.ca_cert,
        cert: sourceOptions.client_cert,
        key: sourceOptions.client_key,
      });
      clientOptions = {
        tls: true,
        secureContext,
      };
    }

    if (sourceOptions.tls_certificate === 'ca_certificate') {
      const secureContext = tls.createSecureContext({
        ca: sourceOptions.ca_cert,
      });

      if (sourceOptions.query_params) {
        uri += sourceOptions.query_params.startsWith('?')
          ? sourceOptions.query_params
          : `?${sourceOptions.query_params}`;
      }

      clientOptions = {
        tls: true,
        secureContext,
      };
    }
    client = new MongoClient(uri, clientOptions);
    await client.connect();
    db = client.db(database);
} else {
  const connStr = sourceOptions.connection_string.trim();
  const explicitFormat = sourceOptions.connection_format;
  const explicitDb = sourceOptions.database;
  const explicitHost = sourceOptions.host;
  const explicitPort = sourceOptions.port;
  const explicitUser = sourceOptions.username;
  const explicitPass = sourceOptions.password;
  const explicitQueryParams = sourceOptions.query_params;

  const protocolMatch = connStr.match(/^(mongodb(?:\+srv)?):\/\//);
  const protocol = protocolMatch ? protocolMatch[1] : explicitFormat;

  const withoutProtocol = connStr.replace(/^(mongodb(?:\+srv)?):\/\//, "");
  const authSplit = withoutProtocol.split("@");
  const authPart = authSplit.length > 1 ? authSplit[0] : "";
  const restPart = authSplit.length > 1 ? authSplit[1] : authSplit[0];

  const restSplit = restPart.split("/");
  const hostsPart = restSplit[0];
  const dbAndParamsPart = restSplit.slice(1).join("/") || "";

  const dbNameFromConn = dbAndParamsPart.split("?")[0] || "";
  const queryParamsFromConn = dbAndParamsPart.includes("?")
    ? `?${dbAndParamsPart.split("?")[1]}`
    : "";

  let connUser = "";
  let connPass = "";

  if (authPart.includes(":")) {
    const [u, p] = authPart.split(":");
    connUser = decodeURIComponent(u);
    connPass = decodeURIComponent(p);
  }

  const finalUser = explicitUser || connUser || "";
  const finalPass = explicitPass || connPass || "";
  const needsAuth = finalUser !== "" && finalPass !== "";
  const hostsList = hostsPart.split(",");

  if (explicitHost) {
    const newPort = explicitPort ? `:${explicitPort}` : "";
    const existingPort = hostsList[0].includes(":")
      ? `:${hostsList[0].split(":")[1]}`
      : "";

    hostsList[0] = newPort
      ? `${explicitHost}${newPort}`
      : `${explicitHost}${existingPort}`;
  }

  const finalHosts = hostsList.join(",");
  const finalDb = explicitDb || dbNameFromConn || "";
  const authSection = needsAuth
    ? `${encodeURIComponent(finalUser)}:${encodeURIComponent(finalPass)}@`
    : "";

  let finalUri = `${protocol}://${authSection}${finalHosts}`;

  let queryParamsToUse = "";
  if (explicitQueryParams) {
    queryParamsToUse = explicitQueryParams.startsWith("?")
      ? explicitQueryParams
      : `?${explicitQueryParams}`;
  } else if (queryParamsFromConn) {
    queryParamsToUse = queryParamsFromConn;
  }

  if (queryParamsToUse) {
    finalUri += queryParamsToUse;
  }

  const paramsLower = queryParamsToUse.toLowerCase();
  const hasSSLInParams = paramsLower.includes('ssl=') || paramsLower.includes('tls=');

  const clientOptions: any = {};
 const isSrvConnection = sourceOptions.connection_format === 'mongodb+srv';
  if (typeof sourceOptions.use_ssl === "boolean") {
    clientOptions.tls = sourceOptions.use_ssl;
  } else if (hasSSLInParams) {
  } else if (isSrvConnection) {
    clientOptions.tls = true;
  }
  client = new MongoClient(finalUri, clientOptions);
  await client.connect();
  db = client.db(finalDb);
}
  return {
    db,
    close: async () => {
      await client?.close?.();
    },
  };
}
}
