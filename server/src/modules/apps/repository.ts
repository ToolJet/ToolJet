import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SessionAppData } from './types';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { isUUID } from 'class-validator';
import { APP_TYPES } from './constants';

@Injectable()
export class AppsRepository extends Repository<App> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  // defaultBranchId — the workspace's default-branch id, or null when git-sync is off.
  // Caller (service layer) computes this via GitSyncConfigsUtilService.getDetails to keep
  // this repository service-free.
  async findBySlug(
    slug: string,
    organizationId: string,
    defaultBranchId: string | null,
    versionId?: string,
    branchId?: string
  ): Promise<App> {
    // Callers (e.g. createGitApp, findAppWithIdOrSlug, valid-app.guard) expect this
    // to return null/undefined on miss and throw only their own NotFoundException
    // upstream if appropriate. Don't throw from here.
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    const workflow = await this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: {
        ...versionCondition,
        type: APP_TYPES.WORKFLOW,
        slug,
        organizationId,
      },
    });

    if (workflow) {
      return workflow;
    }

    if (branchId) {
      // Explicit branch context: prefer a version whose slug lives on that branch.
      const version = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug, branchId },
        relations: ['app'],
      });
      if (version?.app && version.app.organizationId === organizationId) {
        const app = version.app;
        this.overlayMetadata(app, version);
        return app;
      }
      // Miss on a non-default branch is expected: app slugs are stored on the *default-branch*
      // app_versions rows (see below), so a feature branch's versions don't carry the slug. A
      // slug maps to exactly one app regardless of branch, so fall through to the default-branch
      // slug resolution rather than 404-ing feature-branch previews / deep links.
    }

    // App slug lives on the default-branch app_versions rows in all cases (git on or off —
    // every org has a default branch now). Match there; when git is on the is_synced=true
    // row sorts first. Some callers (e.g. private-app-auth.guard) don't resolve the default
    // branch themselves and pass null/undefined; resolve it here so the slug still matches
    // its default-branch row. Without this the query becomes `av.branch_id = NULL` and every
    // git-off app (whose rows live on the default branch) 404s.
    const resolvedDefaultBranchId = defaultBranchId ?? (await this.getDefaultBranchId(this.manager, organizationId));
    if (!resolvedDefaultBranchId) return null;

    const resolvedVersion = await this.dataSource
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .where('av.slug = :slug', { slug })
      .andWhere('av.branch_id = :branchId', { branchId: resolvedDefaultBranchId })
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();

    if (!resolvedVersion?.app || resolvedVersion.app.organizationId !== organizationId) {
      return null;
    }
    const app = resolvedVersion.app;
    this.overlayMetadata(app, resolvedVersion);
    return app;
  }

  async findAppBySlug(slug: string): Promise<App> {
    // Caller (apps/guards/app-auth.guard.ts) checks `if (!app)` and throws its
    // own NotFoundException — return null on miss instead of throwing here.
    // Workflows carry their slug on apps.slug; everything else moved to
    // app_versions.slug after migration 1778000000000. This is a released-app
    // resolution path (slug is the public URL handle), so the slug match is
    // exact / case-sensitive — the trigger-level case-insensitive uniqueness
    // already prevents same-LOWER(slug) duplicates from being created.
    const workflow = await this.findOne({
      where: { type: APP_TYPES.WORKFLOW, slug },
    });

    if (workflow) {
      return workflow;
    }

    // Slug uniqueness is enforced instance-wide on default-branch rows by
    // trg_app_versions_default_branch_slug_unique, so a default-branch slug resolves to
    // exactly one app across all workspaces. Dropping the org scope here is what enables
    // cross-workspace slug lookup (e.g. public app sharing where the requesting user is in a
    // different workspace than the app's owner). Every org has a default branch now, so the
    // slug always resolves on a default-branch row (is_synced=true sorts first when git on).
    const resolvedVersion = await this.dataSource
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .innerJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id AND wb.is_default = true')
      .where('av.slug = :slug', { slug })
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();

    if (!resolvedVersion?.app) {
      return null;
    }

    const app = resolvedVersion.app;
    this.overlayMetadata(app, resolvedVersion);
    return app;
  }

  async retrieveAppDataUsingSlug(slug: string): Promise<SessionAppData> {
    // Resolve the app by its default-branch slug row (git on or off — every org has a
    // default branch). is_synced=true sorts first when git is on.
    const resolved = await this.dataSource
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .innerJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id AND wb.is_default = true')
      .where('av.slug = :slug', { slug })
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();

    if (resolved?.app) {
      return {
        organizationId: resolved.app.organizationId,
        isPublic: resolved.isPublic ?? resolved.app.isPublic,
        isReleased: !!resolved.app.currentVersionId,
      };
    }

    // Fallback to apps table (for workflows)
    let app: App;
    try {
      app = await this.findOneOrFail({ where: { slug } });
    } catch {
      app = await this.findOne({ where: { slug } });
    }

    return {
      organizationId: app?.organizationId,
      isPublic: app?.isPublic,
      isReleased: app?.currentVersionId ? true : false,
    };
  }

  // defaultBranchId — caller-supplied; null when git-sync is off. See findBySlug.
  async findByAppName(
    name: string,
    organizationId: string,
    defaultBranchId: string | null,
    versionId?: string
  ): Promise<App> {
    // app_name lives on the default-branch version rows; match there (is_synced=true first).
    const resolved = await this.dataSource
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .where('av.app_name = :name', { name })
      .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
      .andWhere('av.branch_id = :branchId', { branchId: defaultBranchId })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();

    if (resolved?.app) {
      const app = resolved.app;
      this.overlayMetadata(app, resolved);
      return app;
    }

    // Fallback to apps table (for workflows — they keep name on apps.*)
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: { name, organizationId, ...versionCondition },
    });
  }

  async findOneById(id: string, branchId?: string): Promise<App> {
    const app = await this.findOne({ where: { id } });
    if (app && app.type !== APP_TYPES.WORKFLOW) {
      const version = await this.resolveMetadataVersion(this.manager, app, { branchId });
      this.overlayMetadata(app, version);
    }
    return app;
  }

  async findById(id: string, organizationId: string, versionId?: string, branchId?: string): Promise<App> {
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    const baseWhere = { id, ...versionCondition };
    const where = organizationId ? { ...baseWhere, organizationId } : baseWhere;

    const app = await this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where,
    });

    if (app && app.type !== APP_TYPES.WORKFLOW) {
      const version = await this.resolveMetadataVersion(this.manager, app, { branchId });
      this.overlayMetadata(app, version);
    }
    return app;
  }

  async findByDataQuery(dataQueryId: string, organizationId?: string, versionId?: string): Promise<App> {
    const app = await this.findOne({
      relations: ['appVersions', 'appVersions.dataQueries'],
      where: {
        ...(organizationId ? { organizationId } : {}),
        appVersions: { dataQueries: { id: dataQueryId }, ...(versionId ? { id: versionId } : {}) },
      },
    });

    if (app && app.type !== APP_TYPES.WORKFLOW) {
      // resolveMetadataVersion no longer takes versionId — routes by git-sync state
      // (default branch DRAFT row, or any-row when git is off).
      const version = await this.resolveMetadataVersion(this.manager, app);
      this.overlayMetadata(app, version);
    }
    return app;
  }

  // defaultBranchId — caller-supplied; null when git-sync is off. Ignored when branchId
  // is given (branchId pins the metadata source).
  async findAllOrganizationApps(
    organizationId: string,
    defaultBranchId: string | null,
    branchId?: string
  ): Promise<WorkspaceAppsResponseDto[]> {
    const qb = this.createQueryBuilder('app')
      .select([
        'app.id AS id',
        'app.created_at AS "createdAt"',
        'app.organization_id AS "organizationId"',
        'version.id AS "versionId"',
        'version.name AS "versionName"',
        'version.created_at AS "versionCreatedAt"',
      ])
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.organizationId = :organizationId', { organizationId });

    // Source resolution for the per-app metadata join (av_meta):
    //   - branchId supplied:        most recent row on that exact branch
    //   - no branchId, git enabled: most recent row on the workspace's default branch
    //   - no branchId, git off:     most recent VERSION-type row under the app (any branch_id)
    // Workflows COALESCE through to apps.* since they don't carry metadata on versions.
    if (branchId) {
      qb.addSelect('av_meta.app_name AS name')
        .addSelect('av_meta.slug AS slug')
        .addSelect('av_meta.icon AS icon')
        .addSelect('av_meta.is_public AS "isPublic"')
        .innerJoin(
          'app_versions',
          'av_meta',
          `av_meta.app_id = app.id AND av_meta.branch_id = :branchId AND av_meta.id = (
            SELECT av_inner.id FROM app_versions av_inner
            WHERE av_inner.app_id = app.id AND av_inner.branch_id = :branchId
            ORDER BY av_inner.updated_at DESC
            LIMIT 1
          )`,
          { branchId }
        );
    } else {
      qb.addSelect(`COALESCE(av_meta.app_name, app.name) AS name`)
        .addSelect(`COALESCE(av_meta.slug, app.slug) AS slug`)
        .addSelect(`COALESCE(av_meta.icon, app.icon) AS icon`)
        .addSelect(`COALESCE(av_meta.is_public, app.is_public) AS "isPublic"`);

      // Default (no explicit branch): metadata from the canonical default-branch DRAFT
      // version row. is_synced=true sorts first (the authoritative row when git is on);
      // git-off falls back to the latest such row. COALESCE handles workflows (apps.*).
      qb.leftJoin(
        'app_versions',
        'av_meta',
        `av_meta.app_id = app.id AND av_meta.branch_id = :defaultBranchId
           AND av_meta.version_type = 'version' AND av_meta.status = 'DRAFT' AND av_meta.is_stub = false
           AND av_meta.id = (
             SELECT av_inner.id FROM app_versions av_inner
             WHERE av_inner.app_id = app.id AND av_inner.branch_id = :defaultBranchId
               AND av_inner.version_type = 'version' AND av_inner.status = 'DRAFT' AND av_inner.is_stub = false
             ORDER BY av_inner.is_synced DESC, av_inner.updated_at DESC
             LIMIT 1
           )`,
        { defaultBranchId }
      );
    }

    return await qb.orderBy('app.created_At', 'ASC').addOrderBy('version.created_at', 'ASC').getRawMany();
  }

  // Lists every module in a workspace with branch-aware metadata overlay.
  //   - git enabled (workspace has a default branch) → metadata from the default branch row
  //   - git off                                      → metadata from any VERSION-type row
  // No branchId parameter: modules are workspace-wide listings, not branch-scoped lookups.
  // defaultBranchId — caller-supplied; null when git-sync is off.
  async findAllOrganizationModules(
    organizationId: string,
    defaultBranchId: string | null
  ): Promise<
    { id: string; name: string; icon: string; slug: string; isPublic: boolean; createdAt: Date; updatedAt: Date }[]
  > {
    const qb = this.createQueryBuilder('app')
      .select(['app.id AS id', 'app.created_at AS "createdAt"', 'app.updated_at AS "updatedAt"'])
      .addSelect('COALESCE(av_meta.app_name, app.name) AS name')
      .addSelect('COALESCE(av_meta.slug, app.slug) AS slug')
      .addSelect('COALESCE(av_meta.icon, app.icon) AS icon')
      .addSelect('COALESCE(av_meta.is_public, app.is_public) AS "isPublic"')
      .where('app.organizationId = :organizationId', { organizationId })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE });

    // Metadata from the canonical default-branch DRAFT version row (is_synced=true first;
    // git-off falls back to the latest such row). COALESCE handles workflows (apps.*).
    qb.leftJoin(
      'app_versions',
      'av_meta',
      `av_meta.app_id = app.id AND av_meta.branch_id = :defaultBranchId
         AND av_meta.version_type = 'version' AND av_meta.status = 'DRAFT' AND av_meta.is_stub = false
         AND av_meta.id = (
           SELECT av_inner.id FROM app_versions av_inner
           WHERE av_inner.app_id = app.id AND av_inner.branch_id = :defaultBranchId
             AND av_inner.version_type = 'version' AND av_inner.status = 'DRAFT' AND av_inner.is_stub = false
           ORDER BY av_inner.is_synced DESC, av_inner.updated_at DESC
           LIMIT 1
         )`,
      { defaultBranchId }
    );

    return await qb.orderBy('app.updated_at', 'DESC').getRawMany();
  }

  async findByAppId(appId: string, manager?: EntityManager): Promise<App> {
    const mgr = manager ?? this.manager;
    const app = await mgr.findOne(App, {
      where: { id: appId },
      relations: ['appVersions'],
    });
    if (app && app.type !== APP_TYPES.WORKFLOW) {
      const version = await this.resolveMetadataVersion(mgr, app);
      this.overlayMetadata(app, version);
    }
    return app;
  }

  async findByIdOrSlug(idOrSlug: string): Promise<App | null> {
    const manager = this.manager;
    if (isUUID(idOrSlug)) {
      const app = await manager.findOne(App, {
        where: { id: idOrSlug },
        relations: ['appVersions'],
      });
      if (app) {
        if (app.type === APP_TYPES.WORKFLOW) return app;
        const version = await this.resolveMetadataVersion(manager, app);
        this.overlayMetadata(app, version);
        return app;
      }
    }

    // Slug path: resolve through app_versions.slug. Load app.appVersions in the
    // same join so callers reading app.appVersions (e.g. external-api
    // autoDeployApp) get a shape consistent with the UUID/workflow paths — no
    // separate re-fetch. The av.slug filter only narrows the matched version
    // row; app.appVersions still hydrates the app's full version collection.
    const resolved = await manager
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .leftJoinAndSelect('app.appVersions', 'appVersions')
      .innerJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id AND wb.is_default = true')
      .where('av.slug = :slug', { slug: idOrSlug })
      .orderBy('av.is_synced', 'DESC')
      .addOrderBy('av.updated_at', 'DESC')
      .getOne();

    if (resolved?.app) {
      const app = resolved.app;
      this.overlayMetadata(app, resolved);
      return app;
    }

    // Fallback to apps.slug (workflows — metadata lives on apps.*)
    return manager.findOne(App, { where: { slug: idOrSlug }, relations: ['appVersions'] });
  }

  // ----- helpers ---------------------------------------------------------

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
  //
  // App identity (app_name / slug / icon / is_public) is now an instance-level,
  // default-branch concept: the canonical row is the non-stub DRAFT version_type='version'
  // row on the org's DEFAULT branch. When git sync is ON exactly one such row carries
  // is_synced=true (the authoritative row); ORDER BY is_synced DESC picks it, and when
  // git is off it falls back to the latest such row. This mirrors the DB metadata trigger's
  // own canonical-row selection (sync_published_app_version_metadata_from_draft), so code and
  // trigger agree. branchId is intentionally ignored — meta is always the default-branch row
  // even while editing a feature branch.
  private async resolveMetadataVersion(
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

  private overlayMetadata(app: App, version: AppVersion | null): void {
    if (!version) return;
    app.name = version.appName ?? app.name;
    app.slug = version.slug ?? app.slug;
    app.icon = version.icon ?? app.icon;
    app.isPublic = version.isPublic ?? app.isPublic;
  }
}
