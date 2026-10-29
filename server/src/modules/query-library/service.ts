import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { isUUID } from 'class-validator';
import { Response } from 'express';
import { cloneDeep } from 'lodash';
import { AppEnvironment } from '@entities/app_environments.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { RunLibraryDraftDto } from './dto/execution';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  assertSupportedLibraryKind,
  consumerOptionUuidSql,
  LibraryConsumer,
  libraryUsedByMessage,
  assertLibraryDataSource,
  pickPinnedVersion,
  buildLibraryVariableMap,
  libraryServerReferences,
  replaceLibraryServerReferences,
  libraryTransformationOf,
  withoutLibraryRequestDetails,
  CLIENT_SIDE_LIBRARY_KINDS,
  UNSUPPORTED_LIBRARY_KINDS,
  LIBRARY_QUERY_IS_CLIENT_SIDE,
  toLibraryCatalog,
  LibraryCatalog,
  queryLibraryConsumers,
  toLibraryUsage,
} from '@modules/data-queries/library/library-query.util';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { QueryLibraryRepository } from './repository';
import { CreateLibraryQueryDto, UpdateLibraryQueryDto } from './dto';
import { LibraryDraftService } from './draft.service';
import { LIBRARY_QUERY_AUDIT_KEYS } from './constants';

@Injectable()
export class QueryLibraryService {
  constructor(
    protected readonly repository: QueryLibraryRepository,
    protected readonly dataSourcesRepository: DataSourcesRepository,
    protected readonly abilityService: AbilityService,
    protected readonly queryRuntime: DataQueriesUtilService,
    protected readonly drafts: LibraryDraftService
  ) {}

  async listStaticDataSources(user: User): Promise<DataSource[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const sources = await this.dataSourcesRepository.getStaticDataSources(user.organizationId, manager);
      return sources.filter((source) => !UNSUPPORTED_LIBRARY_KINDS.includes(source.kind));
    });
  }

  async resolveRunTarget(user: User, query: LibraryQuery, dto: RunLibraryDraftDto) {
    if (dto.libraryVersionId && dto.options !== undefined)
      throw new BadRequestException('Saved library versions cannot override options');
    const manager = this.repository.manager;
    const current = await this.repository.findInWorkspace(query.id, user.organizationId);
    if (!current) throw new NotFoundException('Library query not found');
    if ((dto.draftId !== undefined) === (dto.libraryVersionId !== undefined))
      throw new BadRequestException('Supply exactly one of draftId or libraryVersionId');
    const snapshot = dto.libraryVersionId
      ? pickPinnedVersion(
          await manager.findOne(LibraryQueryVersion, {
            where: { id: dto.libraryVersionId, libraryQueryId: current.id },
          }),
          current.id
        )
      : await this.drafts.getDraft(current.id, dto.draftId, manager);
    const target = { kind: snapshot.kind, dataSourceId: snapshot.dataSourceId, options: cloneDeep(snapshot.options) };
    if (dto.draftId && dto.options !== undefined) target.options = cloneDeep(dto.options);
    assertSupportedLibraryKind(target.kind);
    const dataSource = assertLibraryDataSource(await this.authorizeDataSource(user, target.dataSourceId));
    return { target, dataSource };
  }

  async run(user: User, query: LibraryQuery, environmentId: string, dto: RunLibraryDraftDto, response: Response) {
    const { target, dataSource } = await this.resolveRunTarget(user, query, dto);
    if (CLIENT_SIDE_LIBRARY_KINDS.includes(target.kind)) throw new BadRequestException(LIBRARY_QUERY_IS_CLIENT_SIDE);
    const transformation = libraryTransformationOf(target.options);
    const references = libraryServerReferences(target.options);
    const resolved = references.length
      ? await this.queryRuntime.resolveLibraryServerReferences(
          references,
          dataSource,
          user.organizationId,
          environmentId,
          undefined,
          user
        )
      : undefined;
    const { scope, variableMap } = buildLibraryVariableMap(target.options, dto, {
      currentUser: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      resolveServerText: resolved && ((text) => replaceLibraryServerReferences(text, resolved)),
    });
    const entity = Object.assign(new DataQuery(), {
      id: query.id,
      name: query.name,
      kind: target.kind,
      dataSourceId: target.dataSourceId,
      dataSource,
      options: cloneDeep(target.options),
    });
    let result: object;
    try {
      result = await this.queryRuntime.runQuery(
        user,
        entity,
        variableMap,
        response,
        environmentId,
        'library',
        undefined,
        {
          library: { standalone: { organizationId: user.organizationId, name: query.name } },
        }
      );
    } catch (error) {
      const failure = error as { message?: string; description?: string; data?: unknown; metadata?: unknown };
      result = {
        status: 'failed',
        message: failure.message,
        description: failure.description,
        data: failure.data,
        metadata: failure.metadata,
      };
    }
    const clean = withoutLibraryRequestDetails(result);
    return transformation === undefined
      ? clean
      : { ...clean, libraryTransformation: transformation, libraryScope: scope };
  }

  async getCatalog(organizationId: string): Promise<LibraryCatalog> {
    const manager = this.repository.manager;
    const drafts = await this.repository.listForWorkspace(organizationId);
    if (!drafts.length) return { queries: [] };
    const ids = drafts.map(({ id }) => id);
    const versions = await manager.find(LibraryQueryVersion, { where: { libraryQueryId: In(ids) } });
    const folders = await manager.find(LibraryQueryFolder, { where: { organizationId } });
    const folderNames = new Map(folders.map(({ id, name }) => [id, name]));
    const highest: { queryId: string; highest: number }[] = await manager.query(
      'SELECT library_query_id AS "queryId", MAX(version_number)::int AS highest FROM library_query_versions WHERE library_query_id = ANY($1::uuid[]) GROUP BY library_query_id',
      [ids]
    );
    const environments = await manager.find(AppEnvironment, { where: { organizationId } });
    const states = await manager.find(LibraryQueryState, { where: { libraryQueryId: In(ids) } });
    return toLibraryCatalog(
      drafts,
      versions,
      new Map(drafts.map(({ id, folderId }) => [id, folderNames.get(folderId)])),
      new Map(highest.map((row) => [row.queryId, row.highest])),
      new Map(environments.map(({ id, name, priority }) => [id, { id, name, priority }])),
      new Map(states.map((state) => [state.libraryQueryId, state]))
    );
  }

  async getUsage(organizationId: string) {
    return toLibraryUsage(await queryLibraryConsumers(this.repository.manager, organizationId));
  }

  list(user: User): Promise<LibraryQuery[]> {
    return this.repository.listForWorkspace(user.organizationId);
  }

  async authorizeDataSource(user: User, sourceId: string | null, manager?: EntityManager): Promise<DataSource | null> {
    // A deleted source must not prevent loading or editing the surviving draft.
    if (sourceId === null) return null;
    if (!sourceId || !isUUID(sourceId)) throw new BadRequestException('Invalid dataSourceId');
    // The generic source lookup joins apps; standalone execution only needs the source and its plugin.
    const dataSource = await (manager ?? this.dataSourcesRepository.manager).findOne(DataSource, {
      where: { id: sourceId, organizationId: user.organizationId },
      relations: ['plugin'],
    });
    if (!dataSource) throw new NotFoundException('Data source not found');
    assertSupportedLibraryKind(dataSource.kind);
    const permissions = await this.abilityService.resourceActionsPermission(
      user,
      {
        organizationId: user.organizationId,
        resources: [{ resource: MODULES.GLOBAL_DATA_SOURCE, resourceId: sourceId }],
      },
      manager
    );
    const sourcePermissions = permissions[MODULES.GLOBAL_DATA_SOURCE];
    const usable =
      permissions.isAdmin ||
      permissions.isSuperAdmin ||
      permissions.dataSourceCreate ||
      permissions.dataSourceDelete ||
      sourcePermissions?.isAllUsable ||
      sourcePermissions?.isAllConfigurable ||
      sourcePermissions?.usableDataSourcesId?.includes(sourceId) ||
      sourcePermissions?.configurableDataSourceId?.includes(sourceId);
    if (!usable) throw new ForbiddenException('You do not have permission to use this data source');
    return dataSource;
  }

  async create(
    user: User,
    dto: CreateLibraryQueryDto,
    manager?: EntityManager
  ): Promise<LibraryQuery & { draftId: string }> {
    return this.unique(() =>
      dbTransactionWrap(async (transaction: EntityManager) => {
        assertSupportedLibraryKind(dto.kind);
        const source = await this.authorizeDataSource(user, dto.dataSourceId, transaction);
        if (source && source.kind !== dto.kind)
          throw new BadRequestException('Data source kind does not match query kind');
        await this.folder(user, dto.folderId, transaction);
        const query = await transaction.save(
          LibraryQuery,
          transaction.create(LibraryQuery, {
            organizationId: user.organizationId,
            name: dto.name,
            folderId: dto.folderId ?? null,
            createdBy: user.id,
          })
        );
        const draft = await this.drafts.createInitialDraft(
          query.id,
          {
            kind: dto.kind,
            dataSourceId: dto.dataSourceId,
            options: dto.options,
          },
          transaction
        );
        await transaction.save(LibraryQueryState, { libraryQueryId: query.id, releasedVersionId: null });
        this.audit(user, query, LIBRARY_QUERY_AUDIT_KEYS.CREATE, dto.kind);
        return Object.assign(query, { draftId: draft.id });
      }, manager)
    );
  }

  async update(user: User, query: LibraryQuery, dto: UpdateLibraryQueryDto): Promise<LibraryQuery> {
    return this.unique(() =>
      dbTransactionWrap(async (manager: EntityManager) => {
        const locked = await this.lock(user, query.id, manager);
        if (dto.folderId !== undefined) await this.folder(user, dto.folderId, manager);
        if (dto.name !== undefined) locked.name = dto.name;
        if (dto.folderId !== undefined) locked.folderId = dto.folderId;
        const saved = await manager.save(LibraryQuery, locked);
        this.audit(user, saved, LIBRARY_QUERY_AUDIT_KEYS.UPDATE, await this.auditKind(manager, query.id));
        return saved;
      })
    );
  }

  async delete(user: User, query: LibraryQuery): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.lock(user, query.id, manager);
      const kind = await this.auditKind(manager, query.id);
      // Query the standalone model directly until the shared consumer helper is re-keyed.
      const consumers: LibraryConsumer[] = await manager.query(
        `
        SELECT a.id AS "appId", COALESCE(av.app_name, a.name) AS "appName", a.type::text AS "appType", av.name AS "appVersionName"
        FROM data_queries dq JOIN data_sources data_source ON data_source.id = dq.data_source_id
        JOIN app_versions av ON av.id = dq.app_version_id
        JOIN apps a ON a.id = av.app_id
        JOIN library_queries lq ON lq.id = ${consumerOptionUuidSql('libraryQueryId')}
        WHERE lq.id = $1 AND lq.organization_id = $2 AND a.organization_id = $2
          AND data_source.kind = 'library' AND a.type::text IN ('front-end', 'module')`,
        [query.id, user.organizationId]
      );
      if (consumers.length) throw new ConflictException(libraryUsedByMessage(consumers));
      await manager.delete(LibraryQuery, { id: query.id, organizationId: user.organizationId });
      this.audit(user, query, LIBRARY_QUERY_AUDIT_KEYS.DELETE, kind);
    });
  }

  listFolders(user: User): Promise<LibraryQueryFolder[]> {
    return this.repository.manager.find(LibraryQueryFolder, {
      where: { organizationId: user.organizationId },
      order: { name: 'ASC' },
    });
  }
  createFolder(user: User, name: string): Promise<LibraryQueryFolder> {
    return this.unique(() =>
      dbTransactionWrap((manager: EntityManager) =>
        manager.save(LibraryQueryFolder, { organizationId: user.organizationId, name })
      )
    );
  }
  renameFolder(user: User, folderId: string, name: string): Promise<LibraryQueryFolder> {
    return this.unique(() =>
      dbTransactionWrap(async (manager: EntityManager) => {
        const folder = await this.folder(user, folderId, manager);
        return manager.save(LibraryQueryFolder, { ...folder, name });
      })
    );
  }
  async deleteFolder(user: User, folderId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.folder(user, folderId, manager);
      await manager.delete(LibraryQueryFolder, { id: folderId, organizationId: user.organizationId });
    });
  }
  private async folder(
    user: User,
    id: string | null | undefined,
    manager: EntityManager
  ): Promise<LibraryQueryFolder | null> {
    if (id === null || id === undefined) return null;
    if (!isUUID(id)) throw new NotFoundException('Library query folder not found');
    const folder = await manager.findOne(LibraryQueryFolder, { where: { id, organizationId: user.organizationId } });
    if (!folder) throw new NotFoundException('Library query folder not found');
    return folder;
  }
  private async lock(user: User, id: string, manager: EntityManager): Promise<LibraryQuery> {
    const query = await manager.findOne(LibraryQuery, {
      where: { id, organizationId: user.organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!query) throw new NotFoundException('Library query not found');
    return query;
  }
  private async auditKind(manager: EntityManager, libraryQueryId: string): Promise<string | undefined> {
    const saved = await manager.findOne(LibraryQueryVersion, {
      where: { libraryQueryId },
      order: { versionNumber: 'DESC' },
      select: ['kind'],
    });
    if (saved) return saved.kind;
    const draft = await manager.findOne(LibraryQueryDraft, {
      where: { libraryQueryId },
      order: { createdAt: 'ASC' },
      select: ['kind'],
    });
    return draft?.kind;
  }
  private async unique<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('A library query or folder with this name already exists');
      throw error;
    }
  }
  private audit(user: User, query: LibraryQuery, actionType: string, kind?: string): void {
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: query.id,
      resourceName: query.name,
      actionType,
      resourceData: { kind },
    });
  }
}
