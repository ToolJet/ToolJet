import { Injectable, NotFoundException } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { EntityManager, In } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import * as proxy from 'express-http-proxy';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { maybeSetSubPath } from '../helpers/utils.helper';
import { QueryError } from 'src/modules/data_sources/query.errors';
import got from 'got';

@Injectable()
export class PostgrestProxyService {
  constructor(private readonly manager: EntityManager, private readonly configService: ConfigService) {}

  // NOTE: This method forwards request directly to PostgREST Using express middleware
  // If additional functionalities from http proxy isn't used, we can deprecate this
  // and start explicitly making request and handle the responses accordingly
  async proxy(req, res, next) {
    const organizationId = req.headers['tj-workspace-id'] || req.dataQuery?.app?.organizationId;
    req.url = await this.replaceTableNamesAtPlaceholder(req.url, organizationId);
    const authToken = 'Bearer ' + this.signJwtPayload(this.configService.get<string>('PG_USER'));
    req.headers = {};
    req.headers['Authorization'] = authToken;
    req.headers['Prefer'] = 'count=exact'; // To get the total count of records

    res.set('Access-Control-Expose-Headers', 'Content-Range');

    return this.httpProxy(req, res, next);
  }

  async perform(url, method, headers, body) {
    try {
      const authToken = 'Bearer ' + this.signJwtPayload(this.configService.get<string>('PG_USER'));
      const updatedPath = replaceUrlForPostgrest(url);
      let postgrestUrl = (this.configService.get<string>('PGRST_HOST') || 'http://localhost:3001') + updatedPath;

      if (!postgrestUrl.startsWith('http://') && !postgrestUrl.startsWith('https://')) {
        postgrestUrl = 'http://' + postgrestUrl;
      }

      const reqHeaders = {
        ...headers,
        Authorization: authToken,
        Prefer: 'count=exact', // get the total no of records
      };

      const response = await got(postgrestUrl, {
        method,
        headers: reqHeaders,
        responseType: 'json',
        ...(!isEmpty(body) && { body: JSON.stringify(body) }),
      });

      return response.body;
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
  }

  private httpProxy = proxy(this.configService.get<string>('PGRST_HOST') || 'http://localhost:3001', {
    proxyReqPathResolver: function (req) {
      return replaceUrlForPostgrest(req.url);
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
}

function replaceUrlForPostgrest(url: string) {
  const path = '/api/tooljet-db';
  const pathRegex = new RegExp(`${maybeSetSubPath(path)}/proxy`);
  const parts = url.split('?');
  const queryString = parts[1];
  const updatedUrl = parts[0].replace(pathRegex, '');

  return updatedUrl + (queryString ? '?' + queryString : '');
}
