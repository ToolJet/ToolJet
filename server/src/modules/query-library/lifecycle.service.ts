import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { cloneDeep } from 'lodash';
import * as requestIp from 'request-ip';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryDraftService } from './draft.service';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { User } from '@entities/user.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { QueryLibraryService } from './service';
import { SaveLibraryDraftDto, CreateLibraryDraftDto, UpdateLibraryDraftDto } from './dto/lifecycle';
import { ChangeLibraryDataSourceDto } from './dto';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { RequestContext } from '@modules/request-context/service';
import { MODULES } from '@modules/app/constants/modules';
import { AuditLog } from '@entities/audit_log.entity';
import { LIBRARY_QUERY_AUDIT_KEYS } from './constants';
import { LIBRARY_QUERY_VERSION_AUDIT_KEYS } from '@modules/modules/constants';
import {
  assertReleasableLibraryDraft,
  assertLibraryDataSource,
  consumerOptionUuidSql,
  LibraryConsumer,
  libraryUsedByMessage,
} from '@modules/data-queries/library/library-query.util';
import {
  assertVersionDeletable,
  assertCanRelease,
  LibraryQueryVersionsView,
  LibraryDraftView,
  LibraryVersionView,
  nextEnvironmentForPromote,
  toLibraryQueryVersionsView,
} from '@modules/data-queries/library/library-lifecycle.util';

// Save version / Create draft version / Delete draft / Promote / Release for one library query. Every write locks
// the query's `library_queries` row first, so two lifecycle actions on the same query run one after the other.
@Injectable()
export class LibraryLifecycleService {
  constructor(
    protected readonly queryLibraryService: QueryLibraryService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly drafts: LibraryDraftService
  ) {}

  // Drafts live in library_query_drafts; state only tracks the released saved version.
  async getState(manager: EntityManager, libraryQueryId: string): Promise<LibraryQueryState> {
    return (
      (await manager.findOne(LibraryQueryState, { where: { libraryQueryId } })) ??
      manager.create(LibraryQueryState, {
        libraryQueryId,
        releasedVersionId: null,
      })
    );
  }

  async listVersions(query: LibraryQuery): Promise<LibraryQueryVersionsView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      return this.versionsView(manager, query);
    });
  }

  async getDraft(query: LibraryQuery, draftId: string): Promise<LibraryDraftView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      return this.draftView(manager, query, draftId);
    });
  }

  async saveDraft(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dto: SaveLibraryDraftDto,
    manager?: EntityManager
  ): Promise<LibraryVersionView> {
    this.validate(SaveLibraryDraftDto, dto);
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const draft = await this.drafts.getDraft(query.id, draftId, manager);
      await this.assertNameAvailable(manager, query.id, dto.name, draft.id);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, draft.dataSourceId, manager));
      assertReleasableLibraryDraft(draft.kind, draft.options);
      const [{ highest }] = await manager.query(
        'SELECT COALESCE(MAX(version_number), 0)::int AS highest FROM library_query_versions WHERE library_query_id = $1',
        [query.id]
      );
      const development = await manager.findOne(AppEnvironment, {
        where: { organizationId: query.organizationId, priority: 1 },
      });
      const saved = await manager.save(
        LibraryQueryVersion,
        manager.create(LibraryQueryVersion, {
          id: draft.id,
          libraryQueryId: query.id,
          name: dto.name,
          versionNumber: highest + 1,
          kind: draft.kind,
          dataSourceId: draft.dataSourceId,
          options: cloneDeep(draft.options),
          createdBy: user.id,
          currentEnvironmentId: development?.id ?? null,
          createdFromVersionId: draft.createdFromVersionId,
          description: dto.description ?? draft.description,
        })
      );
      await manager.softDelete(LibraryQueryDraft, { id: draft.id, libraryQueryId: query.id });
      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.SAVE,
        'Library Query Version Saved',
        saved
      );
      return this.versionView(manager, query, saved.id);
    }, manager);
  }

  async createDraft(user: User, query: LibraryQuery, dto: CreateLibraryDraftDto): Promise<LibraryDraftView> {
    this.validate(CreateLibraryDraftDto, dto);
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      await this.assertNameAvailable(manager, query.id, dto.name);
      const source = await this.findVersion(manager, query.id, dto.fromVersionId);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, source.dataSourceId, manager));
      const draft = await manager.save(
        LibraryQueryDraft,
        manager.create(LibraryQueryDraft, {
          libraryQueryId: query.id,
          name: dto.name,
          description: null,
          createdFromVersionId: source.id,
          kind: source.kind,
          dataSourceId: source.dataSourceId,
          options: cloneDeep(source.options),
        })
      );
      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.CREATE_DRAFT,
        'Library Query Draft Created',
        draft
      );
      return this.draftView(manager, query, draft.id);
    });
  }

  async updateDraft(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dto: UpdateLibraryDraftDto
  ): Promise<LibraryDraftView> {
    this.validate(UpdateLibraryDraftDto, dto);
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const draft = await this.drafts.getDraft(query.id, draftId, manager);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, draft.dataSourceId, manager));
      if (dto.name !== undefined) await this.assertNameAvailable(manager, query.id, dto.name, draft.id);
      if (Object.keys(dto).length) await manager.update(LibraryQueryDraft, draft.id, dto);
      await this.audit(manager, user, query, LIBRARY_QUERY_AUDIT_KEYS.UPDATE, 'Library Query Draft Updated', draft);
      return this.draftView(manager, query, draft.id);
    });
  }

  async changeDraftDataSource(
    user: User,
    query: LibraryQuery,
    draftId: string,
    dataSourceId: string
  ): Promise<LibraryDraftView> {
    this.validate(ChangeLibraryDataSourceDto, { dataSourceId });
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const draft = await this.drafts.getDraft(query.id, draftId, manager);
      const source = assertLibraryDataSource(
        await this.queryLibraryService.authorizeDataSource(user, dataSourceId, manager)
      );
      await manager.update(LibraryQueryDraft, draft.id, { dataSourceId: source.id, kind: source.kind });
      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_AUDIT_KEYS.UPDATE,
        'Library Query Draft Data Source Changed',
        { ...draft, kind: source.kind }
      );
      return this.draftView(manager, query, draft.id);
    });
  }

  async deleteDraft(user: User, query: LibraryQuery, draftId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const draft = await this.drafts.getDraft(query.id, draftId, manager);
      await this.assertNotPinned(manager, user, query, draft.id);
      await this.assertNotLast(manager, query.id);
      await manager.softDelete(LibraryQueryDraft, { id: draft.id, libraryQueryId: query.id });
      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.DISCARD_DRAFT,
        'Library Query Draft Deleted',
        draft
      );
    });
  }

  private validate<T extends object>(type: new () => T, value: T): void {
    const errors = validateSync(plainToInstance(type, value), { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors.flatMap((error) => Object.values(error.constraints ?? {})));
  }

  private async assertNameAvailable(
    manager: EntityManager,
    libraryQueryId: string,
    name: string,
    ownDraftId?: string
  ): Promise<void> {
    const drafts = await manager.find(LibraryQueryDraft, { where: { libraryQueryId, name } });
    if (
      drafts.some((draft) => draft.id !== ownDraftId) ||
      (await manager.existsBy(LibraryQueryVersion, { libraryQueryId, name }))
    ) {
      throw new ConflictException('A draft or saved version with this name already exists');
    }
  }

  private async assertNotLast(manager: EntityManager, libraryQueryId: string): Promise<void> {
    const count =
      (await manager.countBy(LibraryQueryDraft, { libraryQueryId })) +
      (await manager.countBy(LibraryQueryVersion, { libraryQueryId }));
    if (count <= 1) throw new BadRequestException('The last version cannot be deleted');
  }

  private async draftView(manager: EntityManager, query: LibraryQuery, draftId: string): Promise<LibraryDraftView> {
    const draft = await this.drafts.getDraft(query.id, draftId, manager);
    const parent = draft.createdFromVersionId
      ? await manager.findOne(LibraryQueryVersion, {
          where: { id: draft.createdFromVersionId, libraryQueryId: query.id },
          withDeleted: true,
        })
      : null;
    const { id, name, description, createdFromVersionId, kind, dataSourceId, options, createdAt } = draft;
    return {
      id,
      name,
      description,
      createdFromVersionId,
      kind,
      dataSourceId,
      options,
      createdAt,
      createdFrom: parent?.name ?? null,
    };
  }

  async promote(user: User, query: LibraryQuery, libraryVersionId: string): Promise<LibraryVersionView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const libraryQueryId = query.id;
      const version = await this.findVersion(manager, libraryQueryId, libraryVersionId);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, version.dataSourceId, manager));
      if (!(await this.isMultiEnvironmentLicensed(user))) {
        throw new BadRequestException('Promotion needs the multi-environment feature');
      }

      const environments = await this.environments(manager, query);
      const current = environments.find((environment) => environment.id === version.currentEnvironmentId) ?? null;
      const next = nextEnvironmentForPromote(current, environments);
      await manager.update(LibraryQueryVersion, version.id, { currentEnvironmentId: next.id });

      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.PROMOTE,
        'Library Query Version Promoted',
        version
      );
      return this.versionView(manager, query, version.id);
    });
  }

  // Marks one saved version as the query's Released version, replacing the previous one.
  async release(user: User, query: LibraryQuery, libraryVersionId: string): Promise<LibraryVersionView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.lockQuery(manager, query);
      const libraryQueryId = query.id;
      const version = await this.findVersion(manager, libraryQueryId, libraryVersionId);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, version.dataSourceId, manager));

      const environments = await this.environments(manager, query);
      const environment = environments.find((env) => env.id === version.currentEnvironmentId) ?? null;
      assertCanRelease(environment, await this.isMultiEnvironmentLicensed(user));
      await this.saveState(manager, await this.getState(manager, libraryQueryId), { releasedVersionId: version.id });

      await this.audit(
        manager,
        user,
        query,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.RELEASE,
        'Library Query Released',
        version
      );
      return this.versionView(manager, query, version.id);
    });
  }

  async deleteVersion(user: User, query: LibraryQuery, libraryVersionId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const locked = await this.lockQuery(manager, query);
      const version = await this.findVersion(manager, query.id, libraryVersionId);
      assertVersionDeletable(version, await this.getState(manager, query.id));
      await this.assertNotPinned(manager, user, query, version.id);
      await this.assertNotLast(manager, query.id);
      await manager.softDelete(LibraryQueryVersion, { id: version.id, libraryQueryId: query.id });
      await this.audit(
        manager,
        user,
        locked,
        LIBRARY_QUERY_VERSION_AUDIT_KEYS.DELETE,
        'Library Query Version Deleted',
        version
      );
    });
  }

  private async lockQuery(manager: EntityManager, query: LibraryQuery): Promise<LibraryQuery> {
    await manager.query('SELECT id FROM library_queries WHERE id = $1 AND organization_id = $2 FOR UPDATE', [
      query.id,
      query.organizationId,
    ]);
    const locked = await manager.findOne(LibraryQuery, {
      where: { id: query.id, organizationId: query.organizationId },
    });
    if (!locked) throw new NotFoundException('Library query not found');
    return locked;
  }

  private async assertNotPinned(
    manager: EntityManager,
    user: User,
    query: LibraryQuery,
    versionId: string
  ): Promise<void> {
    const consumers: LibraryConsumer[] = await manager.query(
      `
        SELECT a.id AS "appId", COALESCE(av.app_name, a.name) AS "appName", a.type::text AS "appType", av.name AS "appVersionName"
        FROM data_queries dq JOIN data_sources data_source ON data_source.id = dq.data_source_id
        JOIN app_versions av ON av.id = dq.app_version_id JOIN apps a ON a.id = av.app_id
        JOIN library_queries lq ON lq.id = ${consumerOptionUuidSql('libraryQueryId')}
        WHERE lq.id = $1 AND lq.organization_id = $2 AND a.organization_id = $2
          AND ${consumerOptionUuidSql('libraryQueryVersionId')} = $3
          AND data_source.kind = 'library' AND a.type::text IN ('front-end', 'module')`,
      [query.id, user.organizationId, versionId]
    );
    if (consumers.length) throw new ConflictException(libraryUsedByMessage(consumers));
  }

  private async findVersion(
    manager: EntityManager,
    libraryQueryId: string,
    libraryVersionId: string
  ): Promise<LibraryQueryVersion> {
    // The entity's @DeleteDateColumn leaves deleted versions out.
    const version = await manager.findOne(LibraryQueryVersion, { where: { id: libraryVersionId, libraryQueryId } });
    if (!version) throw new NotFoundException('Library query version not found');
    return version;
  }

  private saveState(manager: EntityManager, state: LibraryQueryState, patch: Partial<LibraryQueryState>) {
    return manager.save(manager.merge(LibraryQueryState, state, patch));
  }

  private isMultiEnvironmentLicensed(user: User): Promise<boolean> {
    return this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT, user.organizationId);
  }

  private environments(manager: EntityManager, query: LibraryQuery): Promise<AppEnvironment[]> {
    return manager.find(AppEnvironment, {
      where: { organizationId: query.organizationId },
      order: { priority: 'ASC' },
    });
  }

  private async versionsView(manager: EntityManager, query: LibraryQuery): Promise<LibraryQueryVersionsView> {
    const libraryQueryId = query.id;
    const rows = await manager.find(LibraryQueryVersion, { where: { libraryQueryId }, withDeleted: true });
    return toLibraryQueryVersionsView(
      await this.getState(manager, libraryQueryId),
      rows,
      await this.environments(manager, query),
      await manager.find(LibraryQueryDraft, { where: { libraryQueryId }, order: { createdAt: 'DESC' } })
    );
  }

  private async versionView(
    manager: EntityManager,
    query: LibraryQuery,
    versionId: string
  ): Promise<LibraryVersionView> {
    const { versions } = await this.versionsView(manager, query);
    return versions.find((version) => version.id === versionId);
  }

  private async audit(
    manager: EntityManager,
    user: User,
    query: LibraryQuery,
    actionType: string,
    name: string,
    version?: Pick<LibraryQueryDraft, 'kind' | 'name'> & { versionNumber?: number }
  ): Promise<void> {
    const request = RequestContext.currentContext?.req;
    // Persist before releasing the parent lock. Do not set deferred interceptor locals,
    // which would emit a duplicate audit entry after this transaction has committed.
    await manager.save(AuditLog, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: query.id,
      resourceName: query.name,
      actionType,
      resourceType: MODULES.QUERY_LIBRARY,
      ipAddress: request ? request['clientIp'] || requestIp.getClientIp(request) : null,
      resourceData: { versionNumber: version?.versionNumber, kind: version?.kind },
      metadata: {
        ...(RequestContext.getTransactionId()
          ? {
              transactionId: RequestContext.getTransactionId(),
              route: RequestContext.getRoute(),
              totalDuration: RequestContext.getStartTime() ? Date.now() - RequestContext.getStartTime() : 'unknown',
            }
          : {}),
        instance_level: false,
        workspace_level: true,
        userAgent: request?.headers['user-agent'],
        tooljetVersion: globalThis.TOOLJET_VERSION,
        ...(request?.user?.['oauthGrantId']
          ? { oauthGrantId: request.user['oauthGrantId'], oauthClientId: request.user['oauthClientId'] }
          : {}),
        data: { name, version: version?.name },
      },
    });
  }
}
