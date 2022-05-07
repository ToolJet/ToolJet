import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from '../../src/entities/data_query.entity';
import { CredentialsService } from './credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourcesService } from './data_sources.service';
import got from 'got';

@Injectable()
export class DataQueriesService {
  constructor(
    private credentialsService: CredentialsService,
    private dataSourcesService: DataSourcesService,
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>
  ) {}

  async findOne(dataQueryId: string): Promise<DataQuery> {
    return await this.dataQueriesRepository.findOne({
      where: { id: dataQueryId },
      relations: ['dataSource', 'app'],
    });
  }

  async all(user: User, query: object): Promise<DataQuery[]> {
    const { app_id: appId, app_version_id: appVersionId }: any = query;
    const whereClause = { appId, ...(appVersionId && { appVersionId }) };

    return await this.dataQueriesRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' }, // Latest query should be on top
    });
  }

  async create(
    user: User,
    name: string,
    kind: string,
    options: object,
    appId: string,
    dataSourceId: string,
    appVersionId?: string // TODO: Make this non optional when autosave is implemented
  ): Promise<DataQuery> {
    const newDataQuery = this.dataQueriesRepository.create({
      name,
      kind,
      options,
      appId,
      dataSourceId,
      appVersionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.dataQueriesRepository.save(newDataQuery);
  }

  async delete(dataQueryId: string) {
    return await this.dataQueriesRepository.delete(dataQueryId);
  }

  async update(user: User, dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    });

    return dataQuery;
  }

  async fetchServiceAndParsedParams(dataSource, dataQuery, queryOptions) {
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const parsedQueryOptions = await this.parseQueryOptions(dataQuery.options, queryOptions);
    const kind = dataQuery.kind;
    const service = new allPlugins[kind]();
    return { service, sourceOptions, parsedQueryOptions };
  }

  async runQuery(user: User, dataQuery: any, queryOptions: object): Promise<object> {
    const dataSource = dataQuery.dataSource?.id ? dataQuery.dataSource : {};
    let { sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
      dataSource,
      dataQuery,
      queryOptions
    );
    let result;

    try {
      return await service.run(sourceOptions, parsedQueryOptions, dataSource.id, dataSource.updatedAt);
    } catch (error) {
      const statusCode = error?.data?.responseObject?.statusCode;

      if (
        error.constructor.name === 'OAuthUnauthorizedClientError' ||
        (statusCode == 401 && sourceOptions['tokenData'])
      ) {
        console.log('Access token expired. Attempting refresh token flow.');

        const accessTokenDetails = await service.refreshToken(sourceOptions, dataSource.id);
        await this.dataSourcesService.updateOAuthAccessToken(accessTokenDetails, dataSource.options, dataSource.id);
        await dataSource.reload();

        ({ sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
          dataSource,
          dataQuery,
          queryOptions
        ));

        result = await service.run(sourceOptions, parsedQueryOptions, dataSource.id, dataSource.updatedAt);
      } else {
        throw error;
      }
    }

    return result;
  }

  checkIfContentTypeIsURLenc(headers: []) {
    const objectHeaders = Object.fromEntries(headers);
    const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
    return contentType === 'application/x-www-form-urlencoded';
  }

  /* This function fetches the access token from the token url set in REST API (oauth) datasource */
  async fetchOAuthToken(sourceOptions: any, code: string): Promise<any> {
    const tooljetHost = process.env.TOOLJET_HOST;
    const isUrlEncoded = this.checkIfContentTypeIsURLenc(sourceOptions['headers']);
    const accessTokenUrl = sourceOptions['access_token_url'];

    const customParams = Object.fromEntries(sourceOptions['custom_auth_params']);
    Object.keys(customParams).forEach((key) => (customParams[key] === '' ? delete customParams[key] : {}));

    const bodyData = {
      code,
      client_id: sourceOptions['client_id'],
      client_secret: sourceOptions['client_secret'],
      grant_type: sourceOptions['grant_type'],
      redirect_uri: `${tooljetHost}/oauth2/authorize`,
      ...customParams,
    };

    const response = await got(accessTokenUrl, {
      method: 'post',
      headers: {
        'Content-Type': isUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
      },
      form: isUrlEncoded ? bodyData : undefined,
      json: !isUrlEncoded ? bodyData : undefined,
    });

    const result = JSON.parse(response.body);
    return { access_token: result['access_token'], refresh_token: result['refresh_token'] };
  }

  /* This function fetches access token from authorization code */
  async authorizeOauth2(dataSource: DataSource, code: string): Promise<any> {
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const tokenData = await this.fetchOAuthToken(sourceOptions, code);

    const tokenOptions = [
      {
        key: 'tokenData',
        value: tokenData,
        encrypted: false,
      },
    ];

    return await this.dataSourcesService.updateOptions(dataSource.id, tokenOptions);
  }

  async parseSourceOptions(options: any): Promise<object> {
    // For adhoc queries such as REST API queries, source options will be null
    if (!options) return {};

    const parsedOptions = {};

    for (const key of Object.keys(options)) {
      const option = options[key];
      const encrypted = option['encrypted'];
      if (encrypted) {
        const credentialId = option['credential_id'];
        const value = await this.credentialsService.getValue(credentialId);
        parsedOptions[key] = value;
      } else {
        parsedOptions[key] = option['value'];
      }
    }

    return parsedOptions;
  }

  async parseQueryOptions(object: any, options: object): Promise<object> {
    if (typeof object === 'object' && object !== null) {
      for (const key of Object.keys(object)) {
        object[key] = await this.parseQueryOptions(object[key], options);
      }
      return object;
    } else if (typeof object === 'string') {
      object = object.replace(/\n/g, ' ');
      if (object.startsWith('{{') && object.endsWith('}}') && (object.match(/{{/g) || []).length === 1) {
        object = options[object];
        return object;
      } else {
        const variables = object.match(/\{\{(.*?)\}\}/g);

        if (variables?.length > 0) {
          for (const variable of variables) {
            object = object.replace(variable, options[variable]);
          }
        }

        return object;
      }
    } else if (Array.isArray(object)) {
      object.forEach((element) => {});

      for (const [index, element] of object) {
        object[index] = await this.parseQueryOptions(element, options);
      }
      return object;
    }
    return object;
  }
}
