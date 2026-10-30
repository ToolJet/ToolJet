import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { cloneDeep } from 'lodash';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { User } from '@entities/user.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { QueryLibraryService } from './service';
import { SaveLibraryVersionDto, CreateLibraryDraftDto } from '@modules/data-queries/dto';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { LIBRARY_QUERY_VERSION_AUDIT_KEYS } from '@modules/modules/constants';
import {
  assertReleasableLibraryDraft,
  assertLibraryDataSource,
  consumerOptionUuidSql,
  LibraryConsumer,
  libraryUsedByMessage,
  libraryVersionName,
} from '@modules/data-queries/library/library-query.util';
import {
  assertVersionDeletable,
  assertCanCreateDraft,
  assertCanDiscardDraft,
  assertCanRelease,
  assertCanSaveDraft,
  LibraryQueryVersionsView,
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
    protected readonly licenseTermsService: LicenseTermsService
  ) {}

  // A missing row means a query that has only ever had its draft; written on the first lifecycle action.
  async getState(manager: EntityManager, libraryQueryId: string): Promise<LibraryQueryState> {
    return (
      (await manager.findOne(LibraryQueryState, { where: { libraryQueryId } })) ??
      manager.create(LibraryQueryState, {
        libraryQueryId,
        hasDraft: true,
        draftCreatedFromVersionId: null,
        draftDescription: null,
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

  // Turns the draft into the next `vN` in the first environment. Joins the caller's transaction when given one.
  async saveVersion(
    user: User,
    query: LibraryQuery,
    dto: SaveLibraryVersionDto,
    manager?: EntityManager
  ): Promise<LibraryVersionView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const libraryQueryId = query.id;
      const draft = await this.lockQuery(manager, query);
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, draft.dataSourceId, manager));
      const state = await this.getState(manager, libraryQueryId);
      const kind = draft.kind;
      const snapshot = { kind, dataSourceId: draft.dataSourceId, options: draft.options };
      const latest = await manager.findOne(LibraryQueryVersion, {
        where: { libraryQueryId },
        order: { versionNumber: 'DESC' },
      });
      assertCanSaveDraft(state, latest, snapshot);
      assertReleasableLibraryDraft(kind, draft.options);

      // Soft-deleted rows count here so a version number is never reused.
      const [{ highest }] = await manager.query(
        'SELECT COALESCE(MAX(version_number), 0)::int AS highest FROM library_query_versions WHERE library_query_id = $1',
        [libraryQueryId]
      );
      const development = await manager.findOne(AppEnvironment, {
        where: { organizationId: query.organizationId, priority: 1 },
      });
      const saved = await manager.save(
        manager.create(LibraryQueryVersion, {
          libraryQueryId,
          versionNumber: highest + 1,
          kind,
          dataSourceId: draft.dataSourceId,
          options: cloneDeep(draft.options),
          createdBy: user.id,
          currentEnvironmentId: development?.id ?? null,
          createdFromVersionId: state.draftCreatedFromVersionId,
          description: dto.description ?? state.draftDescription,
        })
      );
      await this.saveState(manager, state, {
        hasDraft: false,
        draftCreatedFromVersionId: null,
        draftDescription: null,
      });

      this.audit(user, draft, LIBRARY_QUERY_VERSION_AUDIT_KEYS.SAVE, 'Library Query Version Saved', saved);
      return this.versionView(manager, query, saved.id);
    }, manager);
  }

  // Copies a saved version onto the query row, which is the draft.
  async createDraft(user: User, query: LibraryQuery, dto: CreateLibraryDraftDto): Promise<LibraryQueryVersionsView> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const locked = await this.lockQuery(manager, query);
      const libraryQueryId = query.id;
      const state = await this.getState(manager, libraryQueryId);
      const source = await this.findVersion(manager, libraryQueryId, dto.fromVersionId);
      assertCanCreateDraft(state, source);

      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, source.dataSourceId, manager));
      await this.copyOntoDraft(manager, locked, source);
      await this.saveState(manager, state, {
        hasDraft: true,
        draftCreatedFromVersionId: source.id,
        draftDescription: dto.description ?? null,
      });

      this.audit(user, locked, LIBRARY_QUERY_VERSION_AUDIT_KEYS.CREATE_DRAFT, 'Library Query Draft Created', source);
      return this.versionsView(manager, query);
    });
  }

  async discardDraft(user: User, query: LibraryQuery): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const locked = await this.lockQuery(manager, query);
      const libraryQueryId = query.id;
      const state = await this.getState(manager, libraryQueryId);
      assertCanDiscardDraft(state, await manager.count(LibraryQueryVersion, { where: { libraryQueryId } }));
      // Put the row back to what the draft started from (or the latest saved version), so draft pins and editor
      // runs stop running the deleted content.
      const restored =
        (state.draftCreatedFromVersionId &&
          (await manager.findOne(LibraryQueryVersion, {
            where: { id: state.draftCreatedFromVersionId, libraryQueryId },
          }))) ||
        (await manager.findOne(LibraryQueryVersion, { where: { libraryQueryId }, order: { versionNumber: 'DESC' } }));
      assertLibraryDataSource(await this.queryLibraryService.authorizeDataSource(user, restored.dataSourceId, manager));
      await this.copyOntoDraft(manager, locked, restored);
      await this.saveState(manager, state, {
        hasDraft: false,
        draftCreatedFromVersionId: null,
        draftDescription: null,
      });
      this.audit(user, query, LIBRARY_QUERY_VERSION_AUDIT_KEYS.DISCARD_DRAFT, 'Library Query Draft Deleted');
    });
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

      this.audit(user, query, LIBRARY_QUERY_VERSION_AUDIT_KEYS.PROMOTE, 'Library Query Version Promoted', version);
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

      this.audit(user, query, LIBRARY_QUERY_VERSION_AUDIT_KEYS.RELEASE, 'Library Query Released', version);
      return this.versionView(manager, query, version.id);
    });
  }

  async deleteVersion(user: User, query: LibraryQuery, libraryVersionId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const locked = await this.lockQuery(manager, query);
      const version = await this.findVersion(manager, query.id, libraryVersionId);
      assertVersionDeletable(version, await this.getState(manager, query.id));
      const consumers: LibraryConsumer[] = await manager.query(
        `
        SELECT a.id AS "appId", COALESCE(av.app_name, a.name) AS "appName", a.type::text AS "appType", av.name AS "appVersionName"
        FROM data_queries dq JOIN data_sources data_source ON data_source.id = dq.data_source_id
        JOIN app_versions av ON av.id = dq.app_version_id JOIN apps a ON a.id = av.app_id
        JOIN library_queries lq ON lq.id = ${consumerOptionUuidSql('libraryQueryId')}
        WHERE lq.id = $1 AND lq.organization_id = $2 AND a.organization_id = $2
          AND ${consumerOptionUuidSql('libraryQueryVersionId')} = $3
          AND data_source.kind = 'library' AND a.type::text IN ('front-end', 'module')`,
        [query.id, user.organizationId, version.id]
      );
      if (consumers.length) throw new ConflictException(libraryUsedByMessage(consumers));
      await manager.softDelete(LibraryQueryVersion, { id: version.id, libraryQueryId: query.id });
      this.audit(user, locked, LIBRARY_QUERY_VERSION_AUDIT_KEYS.DELETE, 'Library Query Version Deleted', version);
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

  private async copyOntoDraft(
    manager: EntityManager,
    query: LibraryQuery,
    version: LibraryQueryVersion
  ): Promise<void> {
    await manager.update(LibraryQuery, query.id, {
      kind: version.kind,
      dataSourceId: version.dataSourceId,
      options: cloneDeep(version.options),
      updatedAt: new Date(),
    });
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
      await this.environments(manager, query)
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

  private audit(
    user: User,
    query: LibraryQuery,
    actionType: string,
    name: string,
    version?: Pick<LibraryQueryVersion, 'versionNumber' | 'kind'>
  ): void {
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: query.id,
      resourceName: query.name,
      actionType,
      resourceData: { versionNumber: version?.versionNumber, kind: version?.kind },
      metadata: { data: { name, version: version ? libraryVersionName(version) : undefined } },
    });
  }
}
