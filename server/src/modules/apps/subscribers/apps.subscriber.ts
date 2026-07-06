import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Not, UpdateEvent } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';
import { App } from 'src/entities/app.entity';
import { AppVersionType } from 'src/entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

// List endpoints opt out of the per-entity afterLoad hydration and run a single bulk query instead.
export const skipAppEditingVersionHydration = new AsyncLocalStorage<boolean>();

@EventSubscriber()
export class AppsSubscriber implements EntitySubscriberInterface {
  constructor(
    protected readonly appVersionRepository: VersionRepository,
    protected readonly appRepository: AppsRepository,
    protected readonly datasourceRepository: DataSource,
    protected readonly gitSyncConfigsUtilService: GitSyncConfigsUtilService
  ) {
    datasourceRepository.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>): Promise<void> {
    // No-op: apps.slug is never auto-filled at insert time for any app type.
    // Workflows previously got their placeholder filled here because they read
    // apps.slug as their functional slug; now they use app_versions.slug like
    // every other type and apps.slug stays NULL (Postgres allows multiple NULLs
    // on the UNIQUE column).
  }

  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    // Bump apps.updated_at when an AppVersion is saved (status flip, content write,
    // metadata change, hydrate write-back). Inserts intentionally do NOT bump — a new
    // version row landing on branch A shouldn't bubble to the top of branch B's listing.
    // The branch-aware listing query orders by appVersions.updatedAt directly for the
    // branchId case; apps.updated_at remains useful as a coarse fallback for non-branch
    // listings.
    const entity = event.entity;
    if (entity && (entity as any).constructor?.name === 'AppVersion' && (entity as any).appId) {
      await event.manager.update(App, { id: (entity as any).appId }, { updatedAt: new Date() });
    }
  }

  async afterLoad(app: any): Promise<void> {
    // Only fire for App entity loads (single-app/editor paths). AppBase is used by
    // list/admin queries (e.g. /api/folder-apps, /api/apps listing) where the per-row
    // editingVersion lookup would amount to N+1; those callers resolve metadata via
    // explicit JOINs instead.
    if (!(app instanceof App)) return;
    if (!app || (app as any).__loaded) return;

    (app as any).__loaded = true;

    if (skipAppEditingVersionHydration.getStore()) return;

    // Git-sync detection via the central util — gates on license + provider + branch.
    // Workflows are exempt — they don't participate in branching (branch_id always NULL),
    // so the subscriber falls through and picks their single VERSION row even when git
    // is on for the org.
    const isWorkflow = app.type === APP_TYPES.WORKFLOW;
    let isGitEnabled = false;
    if (!isWorkflow) {
      const details = await this.gitSyncConfigsUtilService.getDetails(app.organizationId);
      isGitEnabled = details.isEnabled;
    }

    if (isGitEnabled) {
      // Git on: every editing-version read is branch-scoped. Callers must
      // resolve via x-branch-id (see EE AppsService.getOne lines 257-265 for
      // the canonical override). Leaving `editingVersion` undefined here
      // forces the caller to do its own branch lookup instead of silently
      // serving a stale or wrong-branch row. `isStub` is also left untouched
      // — stub detection in git-on flows is branch-scoped (see
      // ee/apps/service.ts:218-220).
      return;
    }

    // Git off (or workflow): fall back to most-recent non-BRANCH non-stub
    // VERSION row. These rows live on the org's default branch, and there is a
    // single non-stub VERSION DRAFT per app here, so this is deterministic.
    const editingVersion = await this.appVersionRepository.findOne({
      where: { appId: app.id, versionType: Not(AppVersionType.BRANCH), isStub: false },
      order: { updatedAt: 'DESC' },
    });

    if (!editingVersion) {
      (app as any).isStub = true;
      return;
    }

    (app as any).isStub = false;
    (app as any).editingVersion = editingVersion;
  }
}
