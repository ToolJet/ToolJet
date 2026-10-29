import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Request, Response } from 'express';

type RequestWithUser = Request & { user?: { id: string } };
import { DataQueryRepository } from './repository';
import { decamelizeKeys } from 'humps';
import { serializeDataQueries } from './serialization.helper';
import {
  AddToLibraryDto,
  CreateDataQueryDto,
  IUpdatingReferencesOptions,
  ListTablesDto,
  RunLibraryQueryDto,
  UpdateDataQueryDto,
} from './dto';
import {
  assertLibraryDataSource,
  assertLibraryTarget,
  isLibraryUuid,
  assertSupportedLibraryKind,
  buildLibraryVariableMap,
  CLIENT_SIDE_LIBRARY_KINDS,
  LIBRARY_KIND,
  libraryServerReferences,
  libraryTransformationOf,
  LIBRARY_QUERY_IS_CLIENT_SIDE,
  parseLibraryReference,
  resolveLibraryReference,
  replaceLibraryServerReferences,
  toLibraryRunEntity,
  toRunTarget,
  withoutLibraryRequestDetails,
} from './library/library-query.util';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { FEATURE_KEY } from './constants';
import { isEmpty, isEqual } from 'lodash';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { IDataQueriesService, QueryCreateContext, QueryUpdateContext, QueryDeleteContext } from './interfaces/IService';
import { App } from '@entities/app.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { DataQueryExecutionOptions } from './interfaces/IUtilService';
import {
  APP_LEVEL_OPTION_KEYS,
  assertLibraryConsumerOptions,
  libraryScopeViolations,
  splitAppLevelOptions,
} from './library/add-to-library.util';
import { QueryLibraryService } from '@modules/query-library/service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { RequestContext } from '@modules/request-context/service';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { APP_TYPES } from '@modules/apps/constants';
import { AppValidationService } from '@modules/app-validation/service';
import { lockForValidation } from '@modules/app-validation/lock';
import { QueryWrite } from '@modules/app-validation/types';
import { QUERY_NAME_PATTERN } from '@modules/app-validation/catalog';
import { LibraryLifecycleService } from '@modules/query-library/lifecycle.service';

@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly appValidationService: AppValidationService,
    protected readonly queryLibraryService: QueryLibraryService,
    protected readonly abilityService: AbilityService,
    protected readonly libraryLifecycleService: LibraryLifecycleService
  ) {}

  /**
   * Hook called before query creation - override in EE to capture state for history
   */
  protected async beforeQueryCreate(
    user: User,
    dataSource: DataSource,
    dataQueryDto: CreateDataQueryDto
  ): Promise<QueryCreateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query creation - override in EE to queue history
   */
  protected async afterQueryCreate(
    context: QueryCreateContext | null,
    createdQuery: any,
    user: User,
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before query update - override in EE to capture state for history
   */
  protected async beforeQueryUpdate(
    user: User,
    versionId: string,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto
  ): Promise<QueryUpdateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query update - override in EE to queue history
   */
  protected async afterQueryUpdate(
    context: QueryUpdateContext | null,
    user: User,
    versionId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before query deletion - override in EE to capture state for history
   */
  protected async beforeQueryDelete(dataQueryId: string): Promise<QueryDeleteContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query deletion - override in EE to queue history
   */
  protected async afterQueryDelete(
    context: QueryDeleteContext | null,
    dataQueryId: string,
    appVersionId: string | null,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  // Serialises name checks per app version so two concurrent creates/renames cannot
  // both pass the existence check. Lock auto-releases at txn end.
  protected async assertUniqueQueryName(
    manager: EntityManager,
    appVersionId: string,
    name: string,
    excludeQueryId?: string
  ): Promise<void> {
    if (!appVersionId || !name) return;

    await lockForValidation(manager, 'data_query_name', appVersionId);

    const where: any = { appVersionId, name };
    if (excludeQueryId) where.id = Not(excludeQueryId);

    const conflict = await manager.findOne(DataQuery, { where, select: ['id'] });
    if (conflict) {
      throw new ConflictException(`A query named "${name}" already exists in this app version`);
    }
  }

  async getAll(user: User, app: App, versionId: string, mode?: string) {
    const queries = await this.dataQueryRepository.getAll(versionId, mode);
    return { data_queries: serializeDataQueries(queries) };
  }

  async create(user: User, dataSource: DataSource, dataQueryDto: CreateDataQueryDto) {
    const { kind, name, options, app_version_id: appVersionId } = dataQueryDto;

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.organizationId,
      appVersionId,
      'You cannot create queries in the promoted version.'
    );

    const context = await this.beforeQueryCreate(user, dataSource, dataQueryDto);

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      await this.assertUniqueQueryName(manager, appVersionId, name);

      // After the advisory lock, so a parallel create of the same name cannot also pass.
      await this.appValidationService.check(
        'queries',
        [{ op: 'create', id: 'new', data: { name, kind, dataSourceId: dataSource.id, options } } as QueryWrite],
        { appVersionId, organizationId: user.organizationId, manager }
      );

      const dataQuery = await this.dataQueryRepository.createOne(
        {
          name,
          options,
          dataSourceId: dataSource.id,
          appVersionId,
        },
        manager
      );

      const decamelizedQuery = decamelizeKeys({ ...dataQuery, kind });

      decamelizedQuery['options'] = dataQuery.options;

      return decamelizedQuery;
    });

    const operationTimestamp = Date.now();
    this.afterQueryCreate(context, result, user, appVersionId, user?.id, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryCreate failed:', err.message)
    );

    return result;
  }

  async update(user: User, versionId: string, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto) {
    const { name, options } = updateDataQueryDto;

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.organizationId,
      versionId,
      'You cannot update queries in the promoted version.'
    );

    const context = await this.beforeQueryUpdate(user, versionId, dataQueryId, updateDataQueryDto);

    await dbTransactionWrap(async (manager: EntityManager) => {
      // Scoped to the URL's version: the guards and the promoted-version check above ran
      // against it, so a query of any other version (or app) must be unreachable here.
      const existing = await manager.findOne(DataQuery, {
        where: { id: dataQueryId, appVersionId: versionId },
        select: {
          id: true,
          appVersionId: true,
          name: true,
          dataSourceId: true,
          options: true,
          dataSource: { kind: true },
        },
        relations: { dataSource: true },
      });
      if (!existing) {
        throw new NotFoundException('Data query not found');
      }
      if (options !== undefined) assertLibraryConsumerOptions(existing.dataSource?.kind, existing.options, options);
      if (name !== undefined && existing.name !== name) {
        await this.assertUniqueQueryName(manager, existing.appVersionId, name, dataQueryId);
      }

      const touched = Object.keys({ ...(name !== undefined && { name }), ...(options !== undefined && { options }) });
      await this.appValidationService.check(
        'queries',
        [
          {
            op: 'update',
            id: existing.id,
            data: { name: name ?? existing.name, options, dataSourceId: existing.dataSourceId },
            touched,
          } as QueryWrite,
        ],
        { appVersionId: existing.appVersionId, organizationId: user.organizationId, manager }
      );

      await this.dataQueryRepository.updateOne(dataQueryId, { name, options }, manager);
    });

    const operationTimestamp = Date.now();
    this.afterQueryUpdate(context, user, versionId, updateDataQueryDto, user?.id, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryUpdate failed:', err.message)
    );
  }

  // Moves an app query's logic into the workspace query library (copy + save v1) and turns the app query into a
  // consumer pinned to v1, all in one transaction. `dto.sourceOptions` must equal the stored row, so a stale client
  // can't convert something other than what the builder sees; the kept app-level keys come from the stored row.
  async addToLibrary(user: User, app: App, dataQueryId: string, versionId: string, dto: AddToLibraryDto) {
    if (app.type !== APP_TYPES.FRONT_END)
      throw new BadRequestException('Only app queries can be added to the query library');
    // UI writes only report name problems (see VALIDATION_MODE_BY_SOURCE), so this endpoint enforces the pattern itself.
    if (!QUERY_NAME_PATTERN.test(dto.name)) {
      throw new BadRequestException('A query name can only have letters, digits, underscore and hyphen');
    }
    // Opens its own transaction, so it runs before ours.
    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.organizationId,
      versionId,
      'You cannot update queries in the promoted version.'
    );
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Lock the app query so two concurrent conversions run one after the other (the second then sees the
      // changed options and gets a 409 instead of orphaning a library query).
      await manager.query('SELECT id FROM data_queries WHERE id = $1 FOR UPDATE', [dataQueryId]);
      // Scoped to the URL's version, like update: the guards authorised that version, so a query of any other
      // version (released, git-locked) is a 404, not a rewrite.
      const stored = await manager.findOne(DataQuery, {
        where: { id: dataQueryId, appVersionId: versionId },
        relations: { dataSource: true, appVersion: true },
      });
      if (!stored || stored.appVersion?.appId !== app.id) throw new NotFoundException('Data query not found');
      if (!isEqual(stored.options, dto.sourceOptions)) throw new ConflictException('This query changed, try again.');

      const { dataSource } = stored;
      const kind = dataSource.kind;
      assertSupportedLibraryKind(kind);
      // The library copy keeps the same data source row, so it has to be one every app in the workspace can see.
      if (
        dataSource.organizationId !== app.organizationId ||
        (dataSource.scope !== 'global' && dataSource.type !== 'static')
      ) {
        throw new BadRequestException("This query's data source can't be used from the query library.");
      }

      const appLevel = Object.keys(dto.libraryOptions).filter((key) => APP_LEVEL_OPTION_KEYS.includes(key));
      if (appLevel.length) {
        throw new BadRequestException(`The library copy can't carry app-level settings: ${appLevel.join(', ')}`);
      }
      // Library queries take inputs, not parameters.
      if ('parameters' in dto.libraryOptions || (stored.options.parameters ?? []).length) {
        throw new BadRequestException("A query with parameters can't be added to the query library");
      }
      // `libraryScopeViolations` skips `inputs`, so they are checked here: declared with empty defaults, and the app
      // fills exactly those.
      const violations = libraryScopeViolations(kind, dto.libraryOptions);
      if (violations.length) {
        throw new BadRequestException(`The library copy can't read app values: ${violations.join(', ')}`);
      }
      const declared = dto.libraryOptions.inputs ?? [];
      const declaredNames = Array.isArray(declared) ? declared.map((input) => input?.name) : [];
      if (
        !Array.isArray(declared) ||
        declared.some(
          (input) => typeof input?.name !== 'string' || input.defaultValue !== '' || Object.keys(input).length !== 2
        ) ||
        new Set(declaredNames).size !== declaredNames.length ||
        !isEqual([...declaredNames].sort(), Object.keys(dto.inputs).sort())
      ) {
        throw new BadRequestException(
          'The declared inputs must have empty defaults and match the values filled in the app'
        );
      }
      if (Object.values(dto.inputs).some((value) => typeof value !== 'string')) {
        throw new BadRequestException('Input values must be text');
      }

      // Same rule as importing library queries.
      const permissions = await this.abilityService.resourceActionsPermission(user, {
        organizationId: user.organizationId,
      });
      if (!(permissions.isSuperAdmin || permissions.isAdmin || !!permissions.moduleCreate)) {
        throw new ForbiddenException(
          "This query requires adding to the query library, but you don't have permission to create modules. Contact admin."
        );
      }

      const libraryStatic = await this.dataSourceRepository.getStaticDataSourceByKind(
        app.organizationId,
        LIBRARY_KIND,
        manager
      );
      const created = await this.queryLibraryService.create(
        user,
        {
          name: dto.name,
          kind,
          dataSourceId: stored.dataSourceId,
          options: dto.libraryOptions,
        },
        manager
      );
      const released = await this.libraryLifecycleService.saveDraft(
        user,
        created,
        created.draftId,
        { name: 'v1' },
        manager
      );

      const options = {
        ...splitAppLevelOptions(stored.options).appLevel,
        libraryQueryId: created.id,
        libraryQueryVersionId: released.id,
        libraryKind: kind,
        inputs: dto.inputs,
      };
      await this.dataQueryRepository.updateOne(dataQueryId, { options, dataSourceId: libraryStatic.id }, manager);

      return {
        query: { id: stored.id, name: stored.name, kind: LIBRARY_KIND, data_source_id: libraryStatic.id, options },
        libraryQueryId: created.id,
        libraryVersionId: released.id,
      };
    });
  }

  async delete(dataQueryId: string, versionId: string) {
    const historyUserId = (RequestContext.currentContext?.req as RequestWithUser | undefined)?.user?.id;
    const context = await this.beforeQueryDelete(dataQueryId);

    await dbTransactionWrap(async (manager: EntityManager) => {
      // Scoped to the URL's version, like update: the route's guards authorised that
      // version, so a query of any other version (or app) is a 404, not a deletion.
      const stored = await manager.findOne(DataQuery, {
        where: { id: dataQueryId, appVersionId: versionId },
        select: ['id', 'name', 'appVersionId'],
      });
      if (!stored) {
        throw new NotFoundException('Data query not found');
      }
      // Reports handlers that still run this query; deleting is still allowed.
      await this.appValidationService.check(
        'queries',
        [{ op: 'delete', id: stored.id, data: { name: stored.name } } as QueryWrite],
        { appVersionId: stored.appVersionId, manager }
      );

      await this.dataQueryRepository.deleteDataQueryEvents(dataQueryId, manager);
      await this.dataQueryRepository.deleteOne(dataQueryId);
    });

    const operationTimestamp = Date.now();
    const appVersionId = (context as any)?.appVersionId || null;
    this.afterQueryDelete(context, dataQueryId, appVersionId, historyUserId, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryDelete failed:', err.message)
    );
  }

  async bulkUpdateQueryOptions(user: User, dataQueriesOptions: IUpdatingReferencesOptions[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const stored: DataQuery[] = [];
      for (const { id } of dataQueriesOptions) {
        stored.push(
          await this.dataQueryRepository.findOneOrFail({
            where: { id, dataSource: { organizationId: user.organizationId } },
            relations: ['dataSource'],
          })
        );
      }

      stored.forEach((query, i) =>
        assertLibraryConsumerOptions(query.dataSource?.kind, query.options, dataQueriesOptions[i].options)
      );
      // Lock in id order, so two bulk updates over the same rows can't deadlock.

      if (stored.length) {
        const writes: QueryWrite[] = dataQueriesOptions.map(({ id, options }, position) => ({
          op: 'update',
          id,
          data: {
            name: stored[position].name,
            dataSourceId: stored[position].dataSourceId,
            options: options as Record<string, any>,
          },
          touched: ['options'],
        }));
        await this.appValidationService.check('queries', writes, {
          appVersionId: stored[0].appVersionId,
          organizationId: user.organizationId,
          manager,
        });
      }

      for (const { id, options } of dataQueriesOptions) {
        await this.dataQueryRepository.updateOne(id, { options }, manager);
      }
      if (!dataQueriesOptions.length) {
        return [];
      }
      return await this.dataQueryRepository.getMany(
        { id: In(dataQueriesOptions.map((query) => query.id)) },
        [],
        manager
      );
    });
  }

  async runQueryOnBuilder(
    user: User,
    dataQueryId: string,
    environmentId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    ability: AppAbility,
    dataSource: DataSource,
    response: Response,
    mode?: string,
    app?: App
  ) {
    const { options, resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, {
      dataSource: true,
      appVersion: true,
    });

    // Persisting options on run is an EDITOR authoring convenience.
    // This endpoint is also hit by app preview, and there the user is consuming, not editing,
    // so the loaded options must NOT be written back.
    if (mode !== 'view' && ability.can(FEATURE_KEY.UPDATE_ONE, DataSource, dataSource.id) && !isEmpty(options)) {
      assertLibraryConsumerOptions(dataQuery.dataSource?.kind, dataQuery.options, options);
      await this.dataQueryRepository.updateOne(dataQueryId, { options });
      dataQuery['options'] = options;
    }

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, environmentId, mode, app);
  }

  async runQueryForApp(
    user: User,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    response: Response,
    app?: App
  ) {
    const { resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, {
      dataSource: true,
      appVersion: true,
    });

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, undefined, 'view', app);
  }

  // The consumer selects one explicit snapshot; the library identity only supplies workspace/name.
  protected async loadLibraryTarget(consumerQueryId: string, app: App) {
    const manager = this.dataQueryRepository.manager;
    const consumer = await this.dataQueryRepository.getOneById(consumerQueryId, {
      dataSource: true,
      permissions: true,
    });
    const primaryId = consumer?.options?.libraryQueryId;
    const primary = isLibraryUuid(primaryId)
      ? await manager.findOne(LibraryQuery, { where: { id: primaryId, organizationId: app.organizationId } })
      : null;
    assertLibraryTarget({ consumer, library: primary, consumerApp: app });

    const ref = parseLibraryReference(consumer.options);
    const { snapshot } = await resolveLibraryReference(primary.id, ref.id, manager);
    const target = toRunTarget(primary, snapshot);
    assertSupportedLibraryKind(target.kind);
    return { consumer, target };
  }

  // `user` is used by the EE override to apply query-level permissions on the consumer query.

  async getLibraryDefinition(consumerQueryId: string, app: App, user?: User) {
    const { target } = await this.loadLibraryTarget(consumerQueryId, app);
    if (!CLIENT_SIDE_LIBRARY_KINDS.includes(target.kind)) {
      throw new BadRequestException('Only RunJS library queries run in the browser');
    }
    return {
      id: target.queryId,
      name: target.name,
      kind: target.kind,
      code: target.options.code ?? '',
      inputs: target.options.inputs ?? [],
      transformation: libraryTransformationOf(target.options),
    };
  }

  async runLibraryQuery(
    user: User,
    consumerQueryId: string,
    dto: RunLibraryQueryDto,
    response: Response,
    app: App,
    environmentId?: string
  ): Promise<object> {
    const { consumer, target } = await this.loadLibraryTarget(consumerQueryId, app);
    if (CLIENT_SIDE_LIBRARY_KINDS.includes(target.kind)) {
      throw new BadRequestException(LIBRARY_QUERY_IS_CLIENT_SIDE);
    }
    // Refuses a Python transformation (a draft pin can have one) before the query runs.
    const libraryTransformation = libraryTransformationOf(target.options);
    const dataSource = assertLibraryDataSource(
      target.dataSourceId
        ? await this.dataQueryRepository.manager.findOneBy(DataSource, { id: target.dataSourceId })
        : null
    );
    const currentUser = user
      ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
      : undefined;
    // Constants/secrets in defaults are read here, in the consumer's environment, and only for defaults: a supplied
    // value is never resolved. The scope sent to the browser keeps the unresolved text.
    const references = libraryServerReferences(target.options);
    const resolvedReferences = references.length
      ? await this.dataQueryUtilService.resolveLibraryServerReferences(
          references,
          dataSource,
          user ? user.organizationId : app.organizationId,
          environmentId,
          undefined,
          user
        )
      : undefined;
    const { scope, variableMap } = buildLibraryVariableMap(
      target.options,
      { inputs: dto?.inputs },
      {
        currentUser,
        resolveServerText: resolvedReferences && ((text) => replaceLibraryServerReferences(text, resolvedReferences)),
      }
    );
    // Always 'view': runQueryOnBuilder's option write-back must never touch a library query.
    const entity = toLibraryRunEntity(target, dataSource, consumer);
    const result = withoutLibraryRequestDetails(
      await this.runAndGetResult(user, entity, variableMap, response, environmentId, 'view', app, { library: {} })
    );
    // The browser runs the transformation with the scope the server resolved (declared names, defaults applied).
    return libraryTransformation === undefined ? result : { ...result, libraryTransformation, libraryScope: scope };
  }

  async preview(user: User, dataQuery: DataQuery, environmentId: string, options: any, response: Response, app?: App) {
    return this.runAndGetResult(user, dataQuery, options, response, environmentId, undefined, app);
  }

  protected async runAndGetResult(
    user: User,
    dataQuery: DataQuery,
    resolvedOptions: object,
    response: Response,
    environmentId?: string,
    mode?: string,
    app?: App,
    executionOptions?: DataQueryExecutionOptions
  ): Promise<object> {
    let result = {};

    try {
      result = await this.dataQueryUtilService.runQuery(
        user,
        dataQuery,
        resolvedOptions,
        response,
        environmentId,
        mode,
        app,
        executionOptions
      );
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error?.message,
          description: error?.description,
          data: error?.data,
          metadata: error?.metadata,
        };
      } else {
        console.error(error);
        result = {
          status: 'failed',
          message: error?.message || 'Internal server error',
          description: error?.message,
          data: error?.data || {},
        };
      }
    }

    return result;
  }

  async listTablesForApp(
    user: User,
    dataSource: DataSource,
    environmentId: string,
    branchId?: string,
    listTablesOptions?: ListTablesDto
  ) {
    let result = {};
    try {
      result = await this.dataQueryUtilService.listTables(user, dataSource, environmentId, branchId, listTablesOptions);
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error?.message,
          description: error?.description,
          data: error?.data,
        };
      } else {
        console.error(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error?.message,
          data: {},
        };
      }
    }
    return result;
  }

  async changeQueryDataSource(user: User, queryId: string, dataSource: DataSource, newDataSourceId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = await this.dataSourceRepository.findOneOrFail({
        where: { id: newDataSourceId, organizationId: user.organizationId },
      });
      // FIXME: Disabling this check as workflows can change data source of a query with different kind
      // if (dataSource.kind !== newDataSource.kind && dataSource) {
      //   throw new BadRequestException();
      // }

      const stored = await manager.findOne(DataQuery, {
        where: { id: queryId },
        select: ['id', 'name', 'appVersionId'],
      });
      if (stored) {
        // Kind mismatch only warns here: workflows legitimately move queries across kinds.
        await this.appValidationService.check(
          'queries',
          [
            {
              op: 'update',
              id: stored.id,
              data: { name: stored.name, kind: dataSource?.kind, dataSourceId: newDataSourceId },
              touched: ['dataSourceId'],
            } as QueryWrite,
          ],
          { appVersionId: stored.appVersionId, organizationId: user.organizationId, manager }
        );
      }

      return this.dataQueryRepository.updateOne(queryId, { dataSourceId: newDataSource.id }, manager);

      // TODO: Audit logs
    });
  }
}
