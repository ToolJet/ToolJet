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
import { RequestContext } from '@modules/request-context/service';

const FIND_VERSION_MEMO_KEY = 'tj_find_version_memo';

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

  findById(id: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    return m.findOneOrFail(AppVersion, {
      where: { id, appId },
      ...(relations?.length ? { relations } : {}),
    });
  }

  findByName(name: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    return m.findOneOrFail(AppVersion, {
      where: { name, appId },
      ...(relations?.length ? { relations } : {}),
    });
  }

  async findLatestVersionForEnvironment(
    appId: string,
    environmentId: string | null,
    environmentName: string | null,
    organizationId: string,
    manager?: EntityManager
  ): Promise<AppVersion | undefined> {
    const m = manager ?? this.manager;
    const prioritySubquery = m
      .createQueryBuilder()
      .subQuery()
      .select('priority')
      .from(AppEnvironment, 'env')
      .where('env.organizationId = :organizationId', { organizationId })
      .andWhere(environmentId ? 'env.id = :environmentId' : 'env.name = :environmentName')
      .getQuery();

    return m
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
      })
      .getOne();
  }

  async findDataQueriesForVersion(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m.find(DataQuery, {
      where: { appVersionId },
      relations: ['dataSource'],
      select: { dataSource: { kind: true } },
    });
  }

  async findDataQueriesForVersionWithPermissions(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m
      .createQueryBuilder(DataQuery, 'query')
      .where('query.appVersionId = :appVersionId', { appVersionId })
      .leftJoinAndSelect('query.dataSource', 'dataSource')
      .leftJoinAndSelect('query.permissions', 'permission')
      .leftJoinAndSelect('permission.users', 'queryUser')
      .leftJoinAndSelect('queryUser.user', 'user')
      .leftJoinAndSelect('queryUser.permissionGroup', 'group')
      .select(['query', 'dataSource.kind', 'permission', 'queryUser', 'user', 'group'])
      .getMany();
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
    // skip memo for tx-bound manager — caller owns isolation
    if (!manager) {
      const ctx = RequestContext.currentContext;
      const memo = ctx?.res?.locals?.[FIND_VERSION_MEMO_KEY] as Record<string, AppVersion> | undefined;
      if (memo?.[id]) return memo[id];
    }

    const m = manager ?? this.manager;
    const appVersion = await m.findOneOrFail(AppVersion, {
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
      for (const query of appVersion.dataQueries) {
        if (query?.plugin) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }

    if (!manager) {
      const ctx = RequestContext.currentContext;
      if (ctx) {
        const memo = (ctx.res?.locals?.[FIND_VERSION_MEMO_KEY] as Record<string, AppVersion>) ?? {};
        memo[id] = appVersion;
        RequestContext.setLocals(FIND_VERSION_MEMO_KEY, memo);
      }
    }
    return appVersion;
  }

  /**
   * Variant of findVersion that also loads per-query permission grants.
   * NOTE: same metadata caveat as findVersion — `appVersion.app.name / slug / icon /
   * is_public` are raw `apps.*` (NULL for non-workflows post-migration). Overlay at
   * the call site if you need branch-aware metadata.
   */
  async findVersionWithQueryPermissions(id: string, manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    const appVersion = await m
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
      for (const query of appVersion.dataQueries) {
        if (query?.plugin) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }
    return appVersion;
  }

  getVersionsInApp(appId: string, branchId?: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    const where = branchId ? { appId, branchId, isStub: false } : { appId, isStub: false };
    return m.find(AppVersion, { where, order: { createdAt: 'DESC' } });
  }

  getCount(appId: string): Promise<number> {
    return this.manager.count(AppVersion, {
      where: { appId },
    });
  }

  deleteById(versionId: string, manager?: EntityManager): Promise<any> {
    const m = manager ?? this.manager;
    return m.delete(AppVersion, { id: versionId });
  }

  async findAppFromVersion(id: string, organizationId: string, manager?: EntityManager): Promise<App> {
    const m = manager ?? this.manager;
    const appVersion = await m.findOneOrFail(AppVersion, {
      where: { id, app: { organizationId } },
      relations: ['app'],
    });
    const app = appVersion.app;
    // Workflows keep metadata on apps.*; non-workflows carry it on the version row.
    // The version is already in scope — overlay its own metadata directly.
    if (app && app.type !== APP_TYPES.WORKFLOW) {
      this.overlayMetadata(app, appVersion);
    }
    return app;
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
  //   1. Explicit branchId (sub-branch context, git-on) → DRAFT row on that branch.
  //      version_type='branch' rows are NOT mirrored by the metadata triggers, so the
  //      branch's own DRAFT is the source.
  //   2. Default branch (git-on or git-off) → any non-stub row. The propagate /
  //      sync-published triggers mirror app_name/slug/icon/is_public across all
  //      non-stub version_type='version' rows, so every default-branch row carries the
  //      same metadata — no need to single out the DRAFT.
  async resolveMetadataVersion(
    manager: EntityManager,
    app: App,
    options: { branchId?: string } = {}
  ): Promise<AppVersion | null> {
    const { branchId } = options;
    // A branch in scope → that branch's row carries the metadata for the view. Otherwise
    // the default branch, where every non-stub row carries the same app_name/slug/icon/
    // is_public (propagation triggers). Read from any non-stub row — no version_type /
    // status / git-on-off branching; is_synced sorts the canonical row first.
    const targetBranchId = branchId ?? (await this.getDefaultBranchId(manager, app.organizationId));
    if (!targetBranchId) return null;

    return manager
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .where('av.app_id = :appId', { appId: app.id })
      .andWhere('av.branch_id = :branchId', { branchId: targetBranchId })
      .andWhere('av.is_stub = false')
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();
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
    const m = manager ?? this.manager;
    return m.find(AppVersion, {
      where: { appId: app.id },
      relations: [
        'app',
        'dataQueries',
        'dataQueries.dataSource',
        'dataQueries.plugins',
        'dataQueries.plugins.manifestFile',
      ],
    });
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
    const version = await this.manager.findOneOrFail(AppVersion, {
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');

    const app = version.app;
    if (app && app.type !== APP_TYPES.WORKFLOW) {
      // The version is already in scope — its own row carries the metadata for this view,
      // so overlay directly instead of re-resolving.
      this.overlayMetadata(app, version);
    }

    return version;
  }

  /**
   * Variant that accepts either a version id or a version name.
   * NOTE: same metadata caveat as findVersion — `version.app` is raw `apps.*` and is
   * NOT overlaid here. Callers that need branch-accurate metadata should re-fetch
   * via `getAppVersionById` (with branchId) or overlay manually.
   */
  async getAppVersionByIdOrName(versionId: string, appId?: string) {
    let version;
    try {
      version = await this.manager.findOneOrFail(AppVersion, {
        where: { name: versionId, appId },
        relations: ['app'],
      });
    } catch (error) {
      version = await this.manager.findOneOrFail(AppVersion, {
        where: { id: versionId },
        relations: ['app'],
      });
    }
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }

  // Thin DB-level update. Business hooks (e.g. the DRAFT → PUBLISHED transition
  // for default-branch rows) live in `VersionsUtilService.updateVersion` — keep
  // this method pure so it can be reused for plain field updates without
  // dragging in branch / publish lifecycle.
  async updateVersion(versionId: string, editableParams: Partial<AppVersion>, manager?: EntityManager): Promise<void> {
    const m = manager ?? this.manager;
    await m.update(AppVersion, { id: versionId }, { ...editableParams, updatedAt: new Date() });
  }

  async findParentVersionApps(versionId: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    return m.find(AppVersion, { where: { parentVersionId: versionId } });
  }

  async getAllVersions(appId: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    return m.find(AppVersion, { where: { appId }, relations: ['user'] });
  }
}
