import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { EntityManager, In, QueryFailedError } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import * as proxy from 'express-http-proxy';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { maybeSetSubPath } from '../helpers/utils.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';
import { PostgrestError, TooljetDatabaseError, TooljetDbActions } from 'src/modules/tooljet_db/tooljet-db.types';
import { QueryError } from 'src/modules/data_sources/query.errors';
import got from 'got';
import { TooljetDbService } from './tooljet_db.service';
import { validateTjdbJSONBColumnInputs } from 'src/helpers/tooljet_db.helper';

@Injectable()
export class PostgrestProxyService {
  constructor(
    private readonly manager: EntityManager,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private tooljetDbService: TooljetDbService
  ) {}

  // NOTE: This method forwards request directly to PostgREST Using express middleware
  // If additional functionalities from http proxy isn't used, we can deprecate this
  // and start explicitly making request and handle the responses accordingly
  async proxy(req, res, next) {
    const organizationId = req.headers['tj-workspace-id'] || req.dataQuery?.app?.organizationId;

    const dbUser = `user_${organizationId}`;
    const dbSchema = `workspace_${organizationId}`;
    const authToken = 'Bearer ' + this.signJwtPayload(dbUser);

    req.url = await this.replaceTableNamesAtPlaceholder(req.url, organizationId);
    req.headers = {};
    req.headers['Authorization'] = authToken;
    // https://postgrest.org/en/v12/references/api/preferences.html#prefer-header
    req.headers['Prefer'] = `count=exact, return=representation`;
    if (['GET', 'HEAD'].includes(req.method)) req.headers['Accept-Profile'] = dbSchema;
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) req.headers['Content-Profile'] = dbSchema;

    res.set('Access-Control-Expose-Headers', 'Content-Range');

    if (!isEmpty(req.dataQuery) && !isEmpty(req.user)) {
      this.eventEmitter.emit('auditLogEntry', {
        userId: req.user.id,
        organizationId,
        resourceId: req.dataQuery.id,
        resourceName: req.dataQuery.name,
        resourceType: ResourceTypes.DATA_QUERY,
        actionType: ActionTypes.DATA_QUERY_RUN,
        metadata: {},
      });
    }

    const tableId = req.url.split('?')[0].split('/').pop();
    const internalTable = await this.manager.findOne(InternalTable, {
      where: {
        organizationId,
        id: tableId,
      },
    });

    if (internalTable.tableName) {
      const tableInfo = {};
      tableInfo[tableId] = internalTable.tableName;

      req.headers['tableInfo'] = tableInfo;
    }

    if (['PATCH', 'POST'].includes(req.method)) {
      const updatedRequestBody = await this.validateJSONBInputs(organizationId, internalTable.tableName, req.body);
      req.body = { ...req.body, ...updatedRequestBody };
    }

    return this.httpProxy(req, res, next);
  }

  /**
   * Handles the TJDB request from Query Builder
   * @param url
   * @param method
   * @param headers
   * @param body
   * @returns
   */
  async perform(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: Record<string, any>,
    body: Record<string, any> = {}
  ) {
    try {
      const dbUser = `user_${headers['tj-workspace-id']}`;
      const dbSchema = `workspace_${headers['tj-workspace-id']}`;
      const authToken = 'Bearer ' + this.signJwtPayload(dbUser);
      const updatedPath = replaceUrlForPostgrest(url);
      let postgrestUrl = (this.configService.get<string>('PGRST_HOST') || 'http://localhost:3001') + updatedPath;

      if (!postgrestUrl.startsWith('http://') && !postgrestUrl.startsWith('https://')) {
        postgrestUrl = 'http://' + postgrestUrl;
      }

      const tableId = postgrestUrl.split('?')[0].split('/').pop();
      const internalTable = await this.manager.findOne(InternalTable, {
        where: {
          organizationId: headers['tj-workspace-id'],
          id: tableId,
        },
      });

      if (internalTable.tableName) {
        const tableInfo = {};
        tableInfo[tableId] = internalTable.tableName;

        headers['tableinfo'] = tableInfo;
      }

      if (['PATCH', 'POST'].includes(method)) {
        const updatedRequestBody = await this.validateJSONBInputs(
          headers['tj-workspace-id'],
          internalTable.tableName,
          body
        );
        body = { ...body, ...updatedRequestBody };
      }

      const reqHeaders = {
        ...headers,
        Authorization: authToken,
        Prefer: 'count=exact, return=representation',
        ...(['GET', 'HEAD'].includes(method) && { 'Accept-Profile': dbSchema }),
        ...(['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && { 'Content-Profile': dbSchema }),
      };

      const response = await got(postgrestUrl, {
        method,
        headers: reqHeaders,
        responseType: 'json',
        throwHttpErrors: true,
        ...(!isEmpty(body) && { body: JSON.stringify(body) }),
      });

      return response.body;
    } catch (error) {
      if (!isEmpty(error.response.rawBody) && (error.response.statusCode < 200 || error.response.statusCode >= 300)) {
        const postgrestResponse = JSON.parse(error.response.rawBody.toString().toString('utf8'));
        const errorMessage = postgrestResponse.message;
        const errorContext: {
          origin: TooljetDbActions;
          internalTables: { id: string; tableName: string }[];
        } = {
          origin: 'proxy_postgrest',
          internalTables: Object.entries(error.options.headers.tableinfo).map(([key, value]) => ({
            id: key,
            tableName: value as string,
          })),
        };
        const errorObj = new QueryFailedError(postgrestResponse, [], new PostgrestError(postgrestResponse));

        const tooljetDbError = new TooljetDatabaseError(errorMessage, errorContext, errorObj);
        throw new QueryError(tooljetDbError.toString(), { code: tooljetDbError.code }, {});
      }

      throw new QueryError('Query could not be completed', error.message, { message: error.message });
    }
  }

  private httpProxy = proxy(this.configService.get<string>('PGRST_HOST') || 'http://localhost:3001', {
    proxyReqPathResolver: function (req) {
      return replaceUrlForPostgrest(req.url);
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, _userRes) {
      if (proxyRes.statusCode < 200 || proxyRes.statusCode >= 300) {
        const postgrestResponse = Buffer.isBuffer(proxyResData)
          ? JSON.parse(proxyResData.toString('utf8'))
          : proxyResData;

        const errorMessage = postgrestResponse.message;
        const errorContext: {
          origin: TooljetDbActions;
          internalTables: { id: string; tableName: string }[];
        } = {
          origin: 'proxy_postgrest',
          internalTables: Object.entries(userReq.headers.tableInfo).map(([key, value]) => ({
            id: key,
            tableName: value as string,
          })),
        };
        const errorObj = new QueryFailedError(postgrestResponse, [], new PostgrestError(postgrestResponse));

        throw new TooljetDatabaseError(errorMessage, errorContext, errorObj);
      }

      return proxyResData;
    },
  });

  private signJwtPayload(role: string) {
    const payload = { role };
    const secretKey = this.configService.get<string>('PGRST_JWT_SECRET');
    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '1m',
    });

    return token;
  }

  // The table names are wrapped inside placeholder ${}
  // Example:
  // /proxy/${actors}?select=first_name,last_name,${films}(title)
  // to
  // /proxy/table-id-1?select=first_name,last_name,table-id-2(title)
  async replaceTableNamesAtPlaceholder(url: string, organizationId: string) {
    const urlToReplace = decodeURIComponent(url);
    const placeHolders = urlToReplace.match(/\$\{.+\}/g);

    if (isEmpty(placeHolders)) return url;

    const requestedtableNames = placeHolders.map((placeHolder) => placeHolder.slice(2, -1));
    const internalTables = await this.findOrFailAllInternalTableFromTableNames(requestedtableNames, organizationId);
    const internalTableNametoIdMap = requestedtableNames.reduce((acc, tableName) => {
      return {
        ...acc,
        [tableName]: internalTables.find((table) => table.tableName === tableName).id,
      };
    }, {});

    return this.replacePlaceholdersInUrlWithTableIds(internalTableNametoIdMap, requestedtableNames, urlToReplace);
  }

  private replacePlaceholdersInUrlWithTableIds(
    internalTableNametoIdMap: { [x: string]: string },
    tableNames: Array<string>,
    url: string
  ) {
    let urlBeingReplaced = url;

    tableNames.forEach(
      (tableName) =>
        (urlBeingReplaced = urlBeingReplaced.replace('${' + tableName + '}', internalTableNametoIdMap[tableName]))
    );

    return urlBeingReplaced;
  }

  async findOrFailAllInternalTableFromTableNames(requestedTableNames: Array<string>, organizationId: string) {
    const internalTables = await this.manager.find(InternalTable, {
      where: {
        organizationId,
        tableName: In(requestedTableNames),
      },
    });

    const obtainedTableNames = internalTables.map((t) => t.tableName);
    const tableNamesNotInOrg = requestedTableNames.filter((tableName) => !obtainedTableNames.includes(tableName));

    if (isEmpty(tableNamesNotInOrg)) return internalTables;

    throw new NotFoundException('Internal table not found: ' + tableNamesNotInOrg);
  }

  private async validateJSONBInputs(organizationId, tableName, body) {
    const tableDetails = await this.tooljetDbService.perform(organizationId, 'view_table', {
      table_name: tableName,
    });

    const jsonbColumns = tableDetails.columns
      .filter((column) => column.data_type === 'jsonb')
      .map((column) => column.column_name);

    if (jsonbColumns.length) {
      const { inValidValueColumnsList: inValidJsonbColumns, updatedRequestBody } = validateTjdbJSONBColumnInputs(
        jsonbColumns,
        body
      );
      if (inValidJsonbColumns.length) {
        throw new HttpException(
          `Expected JSON values in the following columns : ${inValidJsonbColumns.join(', ')}`,
          400
        );
      }
      return updatedRequestBody;
    }
    return body;
  }
}

function replaceUrlForPostgrest(url: string) {
  const path = '/api/tooljet-db';
  const pathRegex = new RegExp(`${maybeSetSubPath(path)}/proxy`);
  const parts = url.split('?');
  const queryString = parts[1];
  const updatedUrl = parts[0].replace(pathRegex, '');

  return updatedUrl + (queryString ? '?' + queryString : '');
}
