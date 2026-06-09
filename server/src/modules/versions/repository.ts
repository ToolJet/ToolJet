import { AppEnvironment } from '@entities/app_environments.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { catchDbException } from '@helpers/utils.helper';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { decode } from 'js-base64';
import { App } from '@entities/app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { v4 as uuid } from 'uuid';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class VersionRepository extends Repository<AppVersion> {
  constructor(private dataSource: DataSource) {
    super(AppVersion, dataSource.createEntityManager());
  }

  async createOne(
    name: string,
    appId: string,
    firstPriorityEnvId: string,
    definition?: any,
    manager?: EntityManager,
    branchId?: string,
    metadata?: { appName?: string | null; slug?: string | null; icon?: string | null; isPublic?: boolean }
  ): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // moduleReferenceId is module-only; look up parent app type once and gate.
      const parentApp = await manager.findOne(App, { where: { id: appId }, select: ['id', 'type'] });
      const isModule = parentApp?.type === APP_TYPES.MODULE;
      return catchDbException(() => {
        return manager.save(
          AppVersion,
          manager.create(AppVersion, {
            name: name,
            appId: appId,
            definition: definition,
            currentEnvironmentId: firstPriorityEnvId,
            status: AppVersionStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(isModule && { moduleReferenceId: uuid() }),
            ...(branchId && { branchId }),
            // Non-workflow metadata lives on app_versions. Callers pass the initial
            // values for the v1 row so the version starts in sync with the app's
            // user-facing metadata instead of NULL.
            ...(metadata && {
              appName: metadata.appName ?? null,
              slug: metadata.slug ?? null,
              icon: metadata.icon ?? null,
              isPublic: metadata.isPublic ?? false,
            }),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_VERSION_NAME_UNIQUE, message: 'Version name already exists.' }]);
    }, manager || this.manager);
  }

  /**
   * Enforce the cross-version metadata invariant: every version_type='version'
   * row of an app carries identical app-level metadata (app_name / slug / icon /
   * is_public). Call after any write that sets these on a version-type row — a
   * default-branch edit (git off), a publish, or a tag import — so published
   * snapshots and the editor DRAFT never drift apart.
   *
   * Scoped to version_type='version', so sub-branch BRANCH rows (independent
   * feature-branch edits) are left untouched. Only the supplied fields are
   * written, so a partial update (e.g. slug only) leaves the rest in place.
   *
   * Uniqueness triggers are not tripped: the only guarded row is the
   * default-branch DRAFT (branch_id NOT NULL), which already holds these values;
   * every other version-type row is branchless and falls outside the slug /
   * app_name trigger predicates.
   */
  async syncMetadataAcrossVersions(
    appId: string,
    metadata: { appName?: string | null; slug?: string | null; icon?: string | null; isPublic?: boolean },
    manager?: EntityManager
  ): Promise<void> {
    const fields: Record<string, any> = {};
    if (metadata.appName !== undefined) fields.appName = metadata.appName;
    if (metadata.slug !== undefined) fields.slug = metadata.slug;
    if (metadata.icon !== undefined) fields.icon = metadata.icon;
    if (metadata.isPublic !== undefined) fields.isPublic = metadata.isPublic;
    if (Object.keys(fields).length === 0) return;

    return dbTransactionWrap(async (mgr: EntityManager) => {
      await mgr.update(AppVersion, { appId, versionType: AppVersionType.VERSION }, fields);
    }, manager || this.manager);
  }

  findById(id: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(AppVersion, {
        where: { id, appId },
        ...(relations?.length ? { relations } : {}),
      });
    }, manager || this.manager);
  }

  findByName(name: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(AppVersion, {
        where: { name, appId },
        ...(relations?.length ? { relations } : {}),
      });
    }, manager || this.manager);
  }

  async findLatestVersionForEnvironment(
    appId: string,
    environmentId: string | null,
    environmentName: string | null,
    organizationId: string,
    manager?: EntityManager
  ): Promise<AppVersion | undefined> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Subquery to determine the priority of the given environment
      const prioritySubquery = manager
        .createQueryBuilder()
        .subQuery()
        .select('priority')
        .from(AppEnvironment, 'env')
        .where('env.organizationId = :organizationId', { organizationId })
        .andWhere(environmentId ? 'env.id = :environmentId' : 'env.name = :environmentName')
        .getQuery();

      const query = manager
        .createQueryBuilder(AppVersion, 'appVersion')
        .innerJoin(AppEnvironment, 'environment', 'appVersion.currentEnvironmentId = environment.id')
        .where('appVersion.appId = :appId', { appId })
        .andWhere('environment.organizationId = :organizationId', { organizationId })
        .andWhere(`environment.priority >= (${prioritySubquery})`)
        .andWhere('appVersion.version_type != :branchType')
        .orderBy('appVersion.createdAt', 'DESC')
        .setParameters({
          appId,
          organizationId,
          environmentId: environmentId || undefined,
          environmentName: environmentName || undefined,
          branchType: AppVersionType.BRANCH,
        });

      return await query.getOne();
    }, manager || this.manager);
  }

  async findDataQueriesForVersion(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataQuery, {
        where: { appVersionId },
        relations: ['dataSource'],
        select: {
          dataSource: {
            kind: true,
          },
        },
      });
    }, manager || this.manager);
  }

  async findDataQueriesForVersionWithPermissions(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager
        .createQueryBuilder(DataQuery, 'query')
        .where('query.appVersionId = :appVersionId', { appVersionId })
        .leftJoinAndSelect('query.dataSource', 'dataSource')
        .leftJoinAndSelect('query.permissions', 'permission')
        .leftJoinAndSelect('permission.users', 'queryUser')
        .leftJoinAndSelect('queryUser.user', 'user')
        .leftJoinAndSelect('queryUser.permissionGroup', 'group')
        .select(['query', 'dataSource.kind', 'permission', 'queryUser', 'user', 'group'])
        .getMany();
    }, manager || this.manager);
  }

  /**
   * Returns AppVersion with `app`, `dataQueries`, and plugin manifests loaded.
   * NOTE: the nested `appVersion.app` carries the raw `apps.*` row — for non-workflow
   * apps post-migration that means `name / slug / icon / is_public` are NULL. Callers
   * that need the canonical metadata must call `AppsUtilService.overlayAppMetadata` on
   * `appVersion.app` themselves (or read metadata directly off `appVersion`). This
   * method is intentionally left without an internal overlay because its consumers
   * (definition/queries/plugins) don't surface `app.name` etc.
   */
  async findVersion(id: string, manager?: EntityManager): Promise<AppVersion> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager.findOneOrFail(AppVersion, {
        where: { id },
        relations: [
          'app',
          'dataQueries',
          'dataQueries.dataSource',
          'dataQueries.plugins',
          'dataQueries.plugins.manifestFile',
        ],
      });

      if (appVersion?.dataQueries) {
        for (const query of appVersion?.dataQueries) {
          if (query?.plugin) {
            query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
          }
        }
      }

      return appVersion;
    }, manager || this.manager);
  }

  /**
   * Variant of findVersion that also loads per-query permission grants.
   * NOTE: same metadata caveat as findVersion — `appVersion.app.name / slug / icon /
   * is_public` are raw `apps.*` (NULL for non-workflows post-migration). Overlay at
   * the call site if you need branch-aware metadata.
   */
  async findVersionWithQueryPermissions(id: string, manager?: EntityManager): Promise<AppVersion> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager
        .createQueryBuilder(AppVersion, 'appVersion')
        .where('appVersion.id = :id', { id })
        .leftJoinAndSelect('appVersion.app', 'app')
        .leftJoinAndSelect('appVersion.dataQueries', 'dataQueries')
        .leftJoinAndSelect('dataQueries.dataSource', 'dataSource')
        .leftJoinAndSelect('dataQueries.plugins', 'plugins')
        .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
        .leftJoinAndSelect('dataQueries.permissions', 'permission')
        .leftJoinAndSelect('permission.users', 'queryUser')
        .leftJoinAndSelect('queryUser.user', 'user')
        .leftJoinAndSelect('queryUser.permissionGroup', 'group')
        .getOneOrFail();

      if (appVersion?.dataQueries) {
        for (const query of appVersion?.dataQueries) {
          if (query?.plugin) {
            query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
          }
        }
      }

      return appVersion;
    }, manager || this.manager);
  }

  getVersionsInApp(appId: string, branchId?: string, manager?: EntityManager): Promise<AppVersion[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      const where = branchId ? { appId, branchId, isStub: false } : { appId, isStub: false };

      return manager.find(AppVersion, {
        where,
        order: { createdAt: 'DESC' },
      });
    }, manager || this.manager);
  }

  getCount(appId: string): Promise<number> {
    return this.manager.count(AppVersion, {
      where: { appId },
    });
  }

  deleteById(versionId: string, manager?: EntityManager): Promise<any> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.delete(AppVersion, { id: versionId });
    }, manager || this.manager);
  }

  async findAppFromVersion(id: string, organizationId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager.findOneOrFail(AppVersion, {
        where: { id, app: { organizationId } },
        relations: ['app'],
      });
      const app = appVersion.app;
      // Workflows keep metadata on apps.*; non-workflows must overlay from the
      // canonical version row resolved by git-sync state. Forward the loaded
      // version's branchId so the overlay picks that branch's row directly.
      if (app && app.type !== APP_TYPES.WORKFLOW) {
        const metadataVersion = await this.resolveMetadataVersion(manager, app, {
          branchId: appVersion.branchId ?? undefined,
        });
        this.overlayMetadata(app, metadataVersion);
      }
      return app;
    }, manager || this.manager);
  }

  // Returns the workspace's default branch id, or null when git-sync is off.
  private async getDefaultBranchId(manager: EntityManager, organizationId: string): Promise<string | null> {
    if (!organizationId) return null;
    const branch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId, isDefault: true },
      select: ['id'],
    });
    return branch?.id ?? null;
  }

  // Picks the app_version row whose metadata should be overlaid onto `app`.
  // Mirrors AppsRepository.resolveMetadataVersion — same rules.
  //
  // Resolution order:
  //   1. Detect git-sync state via getDefaultBranchId (presence of a default
  //      workspace_branches row).
  //   2. Git enabled + explicit branchId → DRAFT row on that branch.
  //   3. Git enabled + no branchId       → DRAFT row on the default branch.
  //   4. Git disabled                    → any version row (most recent,
  //                                        slug-bearing).
  //
  // DRAFT scoping matches the metadata-write paths (AppsUtilService.update
  // writes the DRAFT row) so published/released snapshots don't shadow current
  // metadata.
  async resolveMetadataVersion(
    manager: EntityManager,
    app: App,
    options: { branchId?: string } = {}
  ): Promise<AppVersion | null> {
    const { branchId } = options;
    const defaultBranchId = await this.getDefaultBranchId(manager, app.organizationId);
    const gitEnabled = !!defaultBranchId;

    const qb = manager
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .where('av.app_id = :appId', { appId: app.id });

    if (gitEnabled) {
      const targetBranchId = branchId ?? defaultBranchId;
      qb.andWhere('av.branch_id = :branchId', { branchId: targetBranchId }).andWhere('av.status = :status', {
        status: AppVersionStatus.DRAFT,
      });
    } else {
      qb.andWhere('av.slug IS NOT NULL');
    }

    const version = await qb.orderBy('av.updated_at', 'DESC').getOne();

    if (!version && gitEnabled && branchId) {
      throw new NotFoundException(`No app version found for app ${app.id} on branch ${branchId}`);
    }
    return version;
  }

  overlayMetadata(app: App, version: AppVersion | null): void {
    if (!version) return;
    app.name = version.appName ?? app.name;
    app.slug = version.slug ?? app.slug;
    app.icon = version.icon ?? app.icon;
    app.isPublic = version.isPublic ?? app.isPublic;
  }

  /**
   * Returns every AppVersion for an app, with `app` and `dataQueries` (+ plugins) loaded.
   * NOTE: same metadata caveat as findVersion — every returned `appVersion.app` carries
   * raw `apps.*` (NULL for non-workflows post-migration). Callers iterating this list
   * for display must overlay metadata via `AppsUtilService.overlayAppMetadata` or read
   * directly off each `appVersion.appName / slug / icon / isPublic`. The branch
   * context isn't known here (we only have the parent app), so an inline overlay
   * would default-branch fallback and could mask sub-branch values.
   */
  async findVersionsFromApp(app: App, manager?: EntityManager): Promise<AppVersion[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersions = await manager.find(AppVersion, {
        where: { appId: app.id },
        relations: [
          'app',
          'dataQueries',
          'dataQueries.dataSource',
          'dataQueries.plugins',
          'dataQueries.plugins.manifestFile',
        ],
      });
      return appVersions;
    }, manager || this.manager);
  }

  /**
   * Fetches a single AppVersion by id and overlays branch-aware metadata onto its `app`
   * relation. Mirrors `AppsRepository.findById` overlay semantics so callers that pin
   * `version.app` onto `request.tj_app` (e.g. app-git/guards/app-resource.guard.ts)
   * surface the correct branch's `name / slug / icon / is_public` instead of the
   * stale `apps.*` columns.
   *
   * Resolution order (workflows are skipped — they keep metadata on apps.*):
   *   - branchId supplied (header / param) → that branch's app_versions row.
   *   - branchId absent, git enabled       → default branch's app_versions row.
   *   - branchId absent, git off           → any slug-bearing row (most recent).
   */
  async getAppVersionById(versionId: string, branchId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const version = await manager.findOneOrFail(AppVersion, {
        where: { id: versionId },
        relations: ['app'],
      });
      if (!version) throw new BadRequestException('Wrong version Id');

      const app = version.app;
      if (app && app.type !== APP_TYPES.WORKFLOW) {
        // Prefer the caller's explicit branchId; fall back to the loaded version's
        // own branchId so overlay still picks the right branch when no header was
        // supplied. versionId is no longer accepted by resolveMetadataVersion.
        const metadataVersion = await this.resolveMetadataVersion(manager, app, {
          branchId: branchId ?? version.branchId ?? undefined,
        });
        this.overlayMetadata(app, metadataVersion);
      }

      return version;
    });
  }

  /**
   * Variant that accepts either a version id or a version name.
   * NOTE: same metadata caveat as findVersion — `version.app` is raw `apps.*` and is
   * NOT overlaid here. Callers that need branch-accurate metadata should re-fetch
   * via `getAppVersionById` (with branchId) or overlay manually.
   */
  async getAppVersionByIdOrName(versionId: string, appId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let version;
      try {
        version = await manager.findOneOrFail(AppVersion, {
          where: { name: versionId, appId: appId },
          relations: ['app'],
        });
      } catch {
        version = await manager.findOneOrFail(AppVersion, {
          where: { id: versionId },
          relations: ['app'],
        });
      }
      if (!version) throw new BadRequestException('Wrong version Id');
      return version;
    });
  }

  // Thin DB-level update. Business hooks (e.g. the DRAFT → PUBLISHED transition
  // for default-branch rows) live in `VersionsUtilService.updateVersion` — keep
  // this method pure so it can be reused for plain field updates without
  // dragging in branch / publish lifecycle.
  async updateVersion(versionId: string, editableParams: Partial<AppVersion>, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap((mgr: EntityManager) => {
      return mgr.update(
        AppVersion,
        { id: versionId },
        {
          ...editableParams,
          updatedAt: new Date(),
        }
      );
    }, manager || this.manager);
  }

  async findParentVersionApps(versionId: string, manager?: EntityManager): Promise<AppVersion[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersions = await manager.find(AppVersion, {
        where: { parentVersionId: versionId },
      });
      return appVersions;
    }, manager || this.manager);
  }

  async getAllVersions(appId: string, manager?: EntityManager): Promise<AppVersion[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersions = await manager.find(AppVersion, {
        where: { appId: appId },
        relations: ['user'],
      });
      return appVersions;
    }, manager || this.manager);
  }
}
