import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findBySlug(slug: string, organizationId: string, versionId?: string, branchId?: string): Promise<App> {
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
      // Explicit branch context: slug must resolve on that branch.
      const version = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug, branchId },
        relations: ['app'],
      });
      if (!version?.app || version.app.organizationId !== organizationId) {
        return null;
      }
      const app = version.app;
      this.overlayMetadata(app, version);
      return app;
    }

    const defaultBranchId = await this.getDefaultBranchId(this.manager, organizationId);
    let resolvedVersion: AppVersion | null = null;

    if (defaultBranchId) {
      // Git sync enabled and no branch id — pick from default branch only.
      resolvedVersion = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug, branchId: defaultBranchId },
        relations: ['app'],
      });
    } else {
      // Git sync disabled — find any slug match across all versions in the workspace.
      resolvedVersion = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug },
        relations: ['app'],
      });
    }

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

    let resolvedVersion: AppVersion = null;
    // Slug uniqueness is enforced instance-wide on default-branch rows by
    // trg_app_versions_default_branch_slug_unique (migration 1779400000000),
    // so a default-branch slug resolves to exactly one app across all
    // workspaces. Dropping the org scope here is what enables cross-workspace
    // slug lookup (e.g. public app sharing where the requesting user is in a
    // different workspace than the app's owner).
    if (await this.checkIfGitEnabled(this.manager)) {
      // 1) Prefer a default-branch row anywhere on the instance — that's the
      //    canonical released slug for git-enabled workspaces.
      resolvedVersion = await this.dataSource
        .getRepository(AppVersion)
        .createQueryBuilder('av')
        .innerJoinAndSelect('av.app', 'app')
        .innerJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id AND wb.is_default = true')
        .where('av.slug = :slug', { slug })
        .orderBy('av.updated_at', 'DESC')
        .getOne();

      // 2) Fall back to a branchless row — but only when the candidate app's
      //    own workspace has no default branch (git sync still off for that
      //    org). The branchless row is the canonical slug holder in that
      //    case; if the org has since enabled git, step 1 would have found
      //    the default-branch row already and this fallback would (correctly)
      //    not apply.
      //    Feature-branch rows are deliberately excluded here: the same slug
      //    can appear on multiple orgs' feature branches (pulled from the same
      //    git source), so accepting them without org context risks returning
      //    the wrong workspace's app. The caller (PrivateAppAuthGuard) handles
      //    feature-branch slugs via a workspace-scoped findBySlug call first.
      if (!resolvedVersion) {
        const candidate = await this.dataSource
          .getRepository(AppVersion)
          .createQueryBuilder('av')
          .innerJoinAndSelect('av.app', 'app')
          .where('av.slug = :slug', { slug })
          .andWhere('av.branch_id IS NULL')
          .orderBy('av.updated_at', 'DESC')
          .getOne();

        if (candidate?.app) {
          const orgDefaultBranchId = await this.getDefaultBranchId(this.manager, candidate.app.organizationId);
          if (!orgDefaultBranchId) {
            resolvedVersion = candidate;
          }
        }
      }
    } else {
      // No default branch exists anywhere on the instance — pick any
      // app_versions row whose slug matches.
      resolvedVersion = await this.dataSource
        .getRepository(AppVersion)
        .createQueryBuilder('av')
        .innerJoinAndSelect('av.app', 'app')
        .where('av.slug = :slug', { slug })
        .orderBy('av.updated_at', 'DESC')
        .getOne();
    }

    if (!resolvedVersion?.app) {
      return null;
    }

    const app = resolvedVersion.app;
    this.overlayMetadata(app, resolvedVersion);
    return app;
  }

  async retrieveAppDataUsingSlug(slug: string): Promise<SessionAppData> {
    const candidate = await this.dataSource.getRepository(AppVersion).findOne({
      where: { slug },
      relations: ['app'],
    });

    let resolved: AppVersion | null = candidate;
    if (candidate?.app) {
      const defaultBranchId = await this.getDefaultBranchId(this.manager, candidate.app.organizationId);
      if (defaultBranchId && candidate.branchId !== defaultBranchId) {
        resolved = await this.dataSource.getRepository(AppVersion).findOne({
          where: { slug, branchId: defaultBranchId },
          relations: ['app'],
        });
      }
    }

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
    } catch (error) {
      app = await this.findOne({ where: { slug } });
    }

    return {
      organizationId: app?.organizationId,
      isPublic: app?.isPublic,
      isReleased: app?.currentVersionId ? true : false,
    };
  }

  async findByAppName(name: string, organizationId: string, versionId?: string): Promise<App> {
    // Candidate row: most recent VERSION-type row carrying this name in the workspace.
    const candidate = await this.dataSource
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .where('av.app_name = :name', { name })
      .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .getOne();

    if (candidate?.app) {
      const defaultBranchId = await this.getDefaultBranchId(this.manager, organizationId);
      let resolved: AppVersion | null = candidate;

      if (defaultBranchId && candidate.branchId !== defaultBranchId) {
        // Git enabled — re-resolve on the default branch (matches by name there).
        resolved = await this.dataSource
          .getRepository(AppVersion)
          .createQueryBuilder('av')
          .innerJoinAndSelect('av.app', 'app')
          .where('av.app_name = :name', { name })
          .andWhere('av.branch_id = :branchId', { branchId: defaultBranchId })
          .andWhere('app.organization_id = :organizationId', { organizationId })
          .getOne();
      }

      if (resolved?.app) {
        const app = resolved.app;
        this.overlayMetadata(app, resolved);
        return app;
      }
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

  async findAllOrganizationApps(organizationId: string, branchId?: string): Promise<WorkspaceAppsResponseDto[]> {
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
    //   - no branchId, git off:     most recent slug-bearing row across all versions
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
      const defaultBranchId = await this.getDefaultBranchId(this.manager, organizationId);

      qb.addSelect(`COALESCE(av_meta.app_name, app.name) AS name`)
        .addSelect(`COALESCE(av_meta.slug, app.slug) AS slug`)
        .addSelect(`COALESCE(av_meta.icon, app.icon) AS icon`)
        .addSelect(`COALESCE(av_meta.is_public, app.is_public) AS "isPublic"`);

      if (defaultBranchId) {
        qb.leftJoin(
          'app_versions',
          'av_meta',
          `av_meta.app_id = app.id AND av_meta.branch_id = :defaultBranchId AND av_meta.id = (
            SELECT av_inner.id FROM app_versions av_inner
            WHERE av_inner.app_id = app.id AND av_inner.branch_id = :defaultBranchId
            ORDER BY av_inner.updated_at DESC
            LIMIT 1
          )`,
          { defaultBranchId }
        );
      } else {
        qb.leftJoin(
          'app_versions',
          'av_meta',
          `av_meta.app_id = app.id AND av_meta.slug IS NOT NULL AND av_meta.id = (
            SELECT av_inner.id FROM app_versions av_inner
            WHERE av_inner.app_id = app.id AND av_inner.slug IS NOT NULL
            ORDER BY av_inner.updated_at DESC
            LIMIT 1
          )`
        );
      }
    }

    return await qb.orderBy('app.created_At', 'ASC').addOrderBy('version.created_at', 'ASC').getRawMany();
  }

  // Lists every module in a workspace with branch-aware metadata overlay.
  //   - git enabled (workspace has a default branch) → metadata from the default branch row
  //   - git off                                      → metadata from any slug-bearing row
  // No branchId parameter: modules are workspace-wide listings, not branch-scoped lookups.
  async findAllOrganizationModules(
    organizationId: string
  ): Promise<
    { id: string; name: string; icon: string; slug: string; isPublic: boolean; createdAt: Date; updatedAt: Date }[]
  > {
    const defaultBranchId = await this.getDefaultBranchId(this.manager, organizationId);

    const qb = this.createQueryBuilder('app')
      .select(['app.id AS id', 'app.created_at AS "createdAt"', 'app.updated_at AS "updatedAt"'])
      .addSelect('COALESCE(av_meta.app_name, app.name) AS name')
      .addSelect('COALESCE(av_meta.slug, app.slug) AS slug')
      .addSelect('COALESCE(av_meta.icon, app.icon) AS icon')
      .addSelect('COALESCE(av_meta.is_public, app.is_public) AS "isPublic"')
      .where('app.organizationId = :organizationId', { organizationId })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE });

    if (defaultBranchId) {
      qb.leftJoin(
        'app_versions',
        'av_meta',
        `av_meta.app_id = app.id AND av_meta.branch_id = :defaultBranchId AND av_meta.id = (
          SELECT av_inner.id FROM app_versions av_inner
          WHERE av_inner.app_id = app.id AND av_inner.branch_id = :defaultBranchId
          ORDER BY av_inner.updated_at DESC
          LIMIT 1
        )`,
        { defaultBranchId }
      );
    } else {
      qb.leftJoin(
        'app_versions',
        'av_meta',
        `av_meta.app_id = app.id AND av_meta.slug IS NOT NULL AND av_meta.id = (
          SELECT av_inner.id FROM app_versions av_inner
          WHERE av_inner.app_id = app.id AND av_inner.slug IS NOT NULL
          ORDER BY av_inner.updated_at DESC
          LIMIT 1
        )`
      );
    }

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
    const candidate = await manager
      .getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .leftJoinAndSelect('app.appVersions', 'appVersions')
      .where('av.slug = :slug', { slug: idOrSlug })
      .orderBy('av.updated_at', 'DESC')
      .getOne();

    if (candidate?.app) {
      const defaultBranchId = await this.getDefaultBranchId(manager, candidate.app.organizationId);
      let resolved: AppVersion | null = candidate;

      if (defaultBranchId && candidate.branchId !== defaultBranchId) {
        // Git enabled — only default-branch rows are authoritative for slug lookup
        resolved = await manager
          .getRepository(AppVersion)
          .createQueryBuilder('av')
          .innerJoinAndSelect('av.app', 'app')
          .leftJoinAndSelect('app.appVersions', 'appVersions')
          .where('av.slug = :slug', { slug: idOrSlug })
          .andWhere('av.branch_id = :branchId', { branchId: defaultBranchId })
          .getOne();
        if (!resolved?.app) resolved = candidate;
      }

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

  // TODO: Check configs instead of searching default branch
  private async checkIfGitEnabled(manager: EntityManager): Promise<boolean> {
    const branch = await manager.findOne(WorkspaceBranch, {
      where: { isDefault: true },
      select: ['id'],
    });
    return !!branch?.id;
  }

  // Picks the app_version row whose metadata should be overlaid onto `app`.
  //
  // Resolution order:
  //   1. Detect branching state via getDefaultBranchId (= workspace_branches row
  //      with is_default=true). Presence of the row = "git sync enabled".
  //   2. Git enabled + explicit branchId → DRAFT row on that branch.
  //   3. Git enabled + no branchId       → DRAFT row on the default branch.
  //   4. Git disabled                    → any version row (most recently
  //                                        updated, slug-bearing).
  //
  // DRAFT scoping in the git-enabled cases mirrors the metadata-write paths
  // (AppsUtilService.update writes the DRAFT BRANCH-type row on sub-branches)
  // and matches the canonical "editor working state" row, so released/published
  // historical snapshots don't shadow the current metadata.
  private async resolveMetadataVersion(
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

  private overlayMetadata(app: App, version: AppVersion | null): void {
    if (!version) return;
    app.name = version.appName ?? app.name;
    app.slug = version.slug ?? app.slug;
    app.icon = version.icon ?? app.icon;
    app.isPublic = version.isPublic ?? app.isPublic;
  }
}
