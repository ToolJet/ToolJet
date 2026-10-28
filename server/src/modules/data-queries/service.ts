import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  CreateDataQueryDto,
  IUpdatingReferencesOptions,
  ListTablesDto,
  RunLibraryQueryDto,
  UpdateDataQueryDto,
} from './dto';
import {
  assertLibraryDataSource,
  assertLibraryTarget,
  assertNotCalledByReleasedVersions,
  assertReleasableLibraryDraft,
  assertSameLibrary,
  assertSupportedLibraryKind,
  buildLibraryVariableMap,
  CLIENT_SIDE_LIBRARY_KINDS,
  isSameLibrarySnapshot,
  latestReleaseOrThrow,
  LibraryCatalog,
  libraryServerReferences,
  libraryTransformationOf,
  libraryUsedByMessage,
  libraryVersionName,
  LIBRARY_QUERY_IS_CLIENT_SIDE,
  parseLibraryVersionRef,
  pickPinnedVersion,
  replaceLibraryServerReferences,
  toLibraryCatalog,
  toLibraryRunEntity,
  toLibrarySiblings,
  toLibraryUsage,
  toRunTarget,
  withoutLibraryRequestDetails,
  UNSUPPORTED_LIBRARY_KINDS,
} from './library/library-query.util';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { FEATURE_KEY } from './constants';
import { cloneDeep, isEmpty } from 'lodash';
import { isUUID } from 'class-validator';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { IDataQueriesService, QueryCreateContext, QueryUpdateContext, QueryDeleteContext } from './interfaces/IService';
import { App } from '@entities/app.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { LIBRARY_QUERY_VERSION_AUDIT_KEYS } from '@modules/modules/constants';
import { RequestContext } from '@modules/request-context/service';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { APP_TYPES } from '@modules/apps/constants';
import { AppValidationService } from '@modules/app-validation/service';
import { lockForValidation } from '@modules/app-validation/lock';
import { QueryWrite } from '@modules/app-validation/types';

@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly appValidationService: AppValidationService
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
        select: ['id', 'appVersionId', 'name', 'dataSourceId'],
      });
      if (!existing) {
        throw new NotFoundException('Data query not found');
      }
      if (name !== undefined && existing.name !== name) {
        await this.assertUniqueQueryName(manager, existing.appVersionId, name, dataQueryId);
        // A rename breaks released code that calls the old name.
        const library = await this.findLibraryQuery(dataQueryId, versionId);
        // Its own released versions never block its rename (same rule as delete).
        if (library) await assertNotCalledByReleasedVersions(library.appVersionId, existing.name, manager, library.id);
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

  // `versionId` is the library app's version (the route's :versionId, already checked against `app`).
  async getLibraryUsage(app: App, versionId: string) {
    const consumers = await this.dataQueryRepository.findLibraryConsumers(app.organizationId, versionId);
    return toLibraryUsage(consumers);
  }

  // Library pickers: names, kinds and input/parameter definitions only, never query text (see toLibraryCatalog).
  async getLibraryCatalog(app: App, versionId: string): Promise<LibraryCatalog> {
    if (app.type !== APP_TYPES.QUERY_LIBRARY) throw new BadRequestException('Not a query library');
    const manager = this.dataQueryRepository.manager;
    const rows = await manager.find(DataQuery, { where: { appVersionId: versionId }, relations: { dataSource: true } });
    const drafts = rows
      .map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.dataSource.kind,
        dataSourceId: row.dataSourceId,
        options: row.options as Record<string, unknown>,
      }))
      .filter((draft) => !UNSUPPORTED_LIBRARY_KINDS.includes(draft.kind));
    if (!drafts.length) return { queries: [] };

    const queryIds = drafts.map((draft) => draft.id);
    // The entity's @DeleteDateColumn leaves soft-deleted versions out.
    const versions = await manager.find(LibraryQueryVersion, {
      where: { dataQueryId: In(queryIds) },
      order: { versionNumber: 'DESC' },
    });
    // Nested folders: the mapping's parent is always the immediate folder.
    const folderRows: { queryId: string; folder: string }[] = await manager.query(
      `SELECT m.child_id AS "queryId", f.name AS "folder"
         FROM data_query_folder_mappings m
         JOIN data_query_folders f ON f.id = m.parent_id
        WHERE m.child_type = 'query' AND m.child_id = ANY($1::uuid[])`,
      [queryIds]
    );
    // Soft-deleted rows count, same as release, so the next number matches what Release will assign.
    const highestRows: { queryId: string; highest: number }[] = await manager.query(
      `SELECT data_query_id AS "queryId", MAX(version_number)::int AS "highest"
         FROM library_query_versions WHERE data_query_id = ANY($1::uuid[]) GROUP BY data_query_id`,
      [queryIds]
    );
    return toLibraryCatalog(
      drafts,
      versions,
      new Map(folderRows.map((row) => [row.queryId, row.folder])),
      new Map(highestRows.map((row) => [row.queryId, row.highest]))
    );
  }

  // Copies the draft into the next `vN` snapshot. The draft row stays editable; pinned apps run the snapshot.
  async releaseLibraryQuery(
    user: User,
    dataQueryId: string,
    app: App
  ): Promise<{ id: string; name: string; versionNumber: number; createdAt: Date }> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Lock the draft so two releases of the same query run one after the other.
      await manager.query('SELECT id FROM data_queries WHERE id = $1 FOR UPDATE', [dataQueryId]);
      const draft = await manager.findOne(DataQuery, {
        where: { id: dataQueryId },
        relations: { dataSource: true, appVersion: true },
      });
      if (!draft || draft.appVersion?.appId !== app.id) throw new NotFoundException('Library query not found');
      if (app.type !== APP_TYPES.QUERY_LIBRARY) {
        throw new BadRequestException('Only query library queries can be released');
      }
      const kind = draft.dataSource.kind;
      assertReleasableLibraryDraft(kind, draft.options);

      // Soft-deleted rows count here so a version number is never reused.
      const [{ latest }] = await manager.query(
        'SELECT COALESCE(MAX(version_number), 0)::int AS latest FROM library_query_versions WHERE data_query_id = $1',
        [dataQueryId]
      );
      const latestRelease = await manager.findOne(LibraryQueryVersion, {
        where: { dataQueryId },
        order: { versionNumber: 'DESC' },
      });
      const snapshot = { kind, dataSourceId: draft.dataSourceId, options: draft.options };
      if (latestRelease && isSameLibrarySnapshot(latestRelease, snapshot)) {
        throw new BadRequestException(`Nothing changed since ${libraryVersionName(latestRelease)}`);
      }

      const released = await manager.save(
        manager.create(LibraryQueryVersion, {
          dataQueryId,
          versionNumber: latest + 1,
          kind,
          dataSourceId: draft.dataSourceId,
          options: cloneDeep(draft.options),
          createdBy: user.id,
        })
      );

      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: draft.id,
        resourceName: draft.name,
        actionType: LIBRARY_QUERY_VERSION_AUDIT_KEYS.RELEASE,
        resourceData: { appId: app.id, versionNumber: released.versionNumber, kind },
        metadata: { data: { name: 'Library Query Released', version: libraryVersionName(released) } },
      });

      return {
        id: released.id,
        name: libraryVersionName(released),
        versionNumber: released.versionNumber,
        createdAt: released.createdAt,
      };
    });
  }

  // Soft-deletes one released version. Blocked while any app or module version pins it. The route's guards
  // already resolved `app` from the query inside the URL's app version, so a query of another app is a 404.
  async deleteLibraryQueryVersion(dataQueryId: string, libraryVersionId: string, app: App): Promise<void> {
    if (app.type !== APP_TYPES.QUERY_LIBRARY) throw new BadRequestException('Not a query library');
    const manager = this.dataQueryRepository.manager;
    const query = await manager.findOne(DataQuery, { where: { id: dataQueryId }, relations: { appVersion: true } });
    if (!query || query.appVersion?.appId !== app.id) throw new NotFoundException('Library query not found');
    // The entity's @DeleteDateColumn leaves already-deleted versions out.
    const version = isUUID(libraryVersionId)
      ? await manager.findOne(LibraryQueryVersion, { where: { id: libraryVersionId, dataQueryId } })
      : null;
    if (!version) throw new NotFoundException('Library query version not found');

    const consumers = await this.dataQueryRepository.findLibraryConsumers(
      app.organizationId,
      query.appVersionId,
      query.id,
      version.id
    );
    if (consumers.length) throw new ConflictException(libraryUsedByMessage(consumers));

    await manager.softDelete(LibraryQueryVersion, { id: version.id });

    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: (RequestContext.currentContext?.req as RequestWithUser | undefined)?.user?.id,
      organizationId: app.organizationId,
      resourceId: query.id,
      resourceName: query.name,
      actionType: LIBRARY_QUERY_VERSION_AUDIT_KEYS.DELETE,
      resourceData: { appId: app.id, versionNumber: version.versionNumber, kind: version.kind },
      metadata: { data: { name: 'Library Query Version Deleted', version: libraryVersionName(version) } },
    });
  }

  // The library query a data query id points at, or null for a query in any other kind of app.
  // Scoped to the URL's version before any message is built: a library query of another app or workspace is a
  // 404, never a list of its consumers or callers.
  protected async findLibraryQuery(dataQueryId: string, versionId: string) {
    const query = await this.dataQueryRepository.getOneById(dataQueryId, { appVersion: { app: true } });
    const app = query?.appVersion?.app;
    if (app?.type !== APP_TYPES.QUERY_LIBRARY) return null;
    if (query.appVersionId !== versionId) throw new NotFoundException('Data query not found');
    return { id: query.id, name: query.name, appVersionId: query.appVersionId, organizationId: app.organizationId };
  }

  // Deleting a library query is refused while an app/module version uses it or a released version
  // of another library query calls it by name.
  protected async assertLibraryQueryDeletable(dataQueryId: string, versionId: string) {
    const library = await this.findLibraryQuery(dataQueryId, versionId);
    if (!library) return;
    const consumers = await this.dataQueryRepository.findLibraryConsumers(
      library.organizationId,
      library.appVersionId,
      library.id
    );
    if (consumers.length) throw new ConflictException(libraryUsedByMessage(consumers));
    await assertNotCalledByReleasedVersions(
      library.appVersionId,
      library.name,
      this.dataQueryRepository.manager,
      library.id
    );
  }

  async delete(dataQueryId: string, versionId: string) {
    await this.assertLibraryQueryDeletable(dataQueryId, versionId);
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

  // Primary: the consumer's pinned version (or the draft). Sibling: the sibling's latest release.
  // `libraryDraft` is the library query row behind the target; the run uses its app version.
  protected async loadLibraryTarget(consumerQueryId: string, app: App, siblingQueryId?: string) {
    const manager = this.dataQueryRepository.manager;
    const consumer = await this.dataQueryRepository.getOneById(consumerQueryId, {
      dataSource: true,
      permissions: true,
    });
    const primaryId = consumer?.options?.libraryQueryId;
    const primary = primaryId
      ? await this.dataQueryRepository.getOneById(primaryId, { dataSource: true, appVersion: { app: true } })
      : null;
    const libraryApp = primary?.appVersion?.app ?? null;
    assertLibraryTarget({ consumer, library: primary, consumerApp: app, libraryApp });

    const ref = parseLibraryVersionRef(consumer.options?.libraryQueryVersionId);
    const pinned = ref.draft
      ? null
      : pickPinnedVersion(await manager.findOneBy(LibraryQueryVersion, { id: ref.versionId }), primary.id);
    const primaryTarget = toRunTarget(primary, pinned);

    if (!siblingQueryId || siblingQueryId === primary.id) {
      assertSupportedLibraryKind(primaryTarget.kind);
      return { consumer, target: primaryTarget, libraryDraft: primary, libraryApp };
    }

    const sibling = await this.dataQueryRepository.getOneById(siblingQueryId, {
      dataSource: true,
      appVersion: { app: true },
    });
    assertSameLibrary({ kind: primaryTarget.kind, appVersionId: primary.appVersionId }, sibling);
    const latest = await manager.findOne(LibraryQueryVersion, {
      where: { dataQueryId: sibling.id },
      order: { versionNumber: 'DESC' },
    });
    const target = toRunTarget(sibling, latestReleaseOrThrow(sibling.name, latest));
    assertSupportedLibraryKind(target.kind);
    return { consumer, target, libraryDraft: sibling, libraryApp };
  }

  // `user` is used by the EE override to apply query-level permissions on the consumer query.

  async getLibraryDefinition(consumerQueryId: string, app: App, libraryQueryId?: string, user?: User) {
    const { target, libraryDraft } = await this.loadLibraryTarget(consumerQueryId, app, libraryQueryId);
    if (!CLIENT_SIDE_LIBRARY_KINDS.includes(target.kind)) {
      throw new BadRequestException('Only RunJS library queries run in the browser');
    }
    const drafts = await this.dataQueryRepository.getAll(libraryDraft.appVersionId);
    // The entity's @DeleteDateColumn leaves soft-deleted versions out.
    const versions = await this.dataQueryRepository.manager.find(LibraryQueryVersion, {
      where: { dataQueryId: In(drafts.map((draft) => draft.id)) },
      select: { dataQueryId: true, versionNumber: true, kind: true },
    });
    return {
      id: target.queryId,
      name: target.name,
      kind: target.kind,
      code: target.options.code ?? '',
      inputs: target.options.inputs ?? [],
      parameters: target.options.parameters ?? [],
      transformation: libraryTransformationOf(target.options),
      siblings: toLibrarySiblings(drafts, versions),
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
    const { consumer, target, libraryDraft } = await this.loadLibraryTarget(consumerQueryId, app, dto?.libraryQueryId);
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
          libraryDraft.appVersion?.branchId,
          user
        )
      : undefined;
    const { scope, variableMap } = buildLibraryVariableMap(
      target.options,
      { inputs: dto?.inputs, parameters: dto?.parameters },
      {
        currentUser,
        resolveServerText: resolvedReferences && ((text) => replaceLibraryServerReferences(text, resolvedReferences)),
      }
    );
    // Always 'view': runQueryOnBuilder's option write-back must never touch a library query.
    const entity = toLibraryRunEntity(target, libraryDraft, dataSource, consumer);
    const result = withoutLibraryRequestDetails(
      await this.runAndGetResult(user, entity, variableMap, response, environmentId, 'view', app)
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
    app?: App
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
        undefined // opts parameter
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
