import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Not, UpdateEvent } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';
import { App } from 'src/entities/app.entity';
import { AppVersionType } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';

// List endpoints opt out of the per-entity afterLoad hydration and run a single bulk query instead.
export const skipAppEditingVersionHydration = new AsyncLocalStorage<boolean>();

@EventSubscriber()
export class AppsSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly appVersionRepository: VersionRepository,
    private readonly appRepository: AppsRepository,
    private readonly datasourceRepository: DataSource
  ) {
    datasourceRepository.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>): Promise<void> {
    const entity = event.entity;
    if (!(entity instanceof App)) return;
    // Workflows keep slug on apps.* — auto-fill the placeholder if not provided.
    // Non-workflows store slug on app_versions; leave apps.slug as NULL. Postgres
    // allows multiple NULLs on a UNIQUE column so this doesn't violate the constraint.
    if (entity.type === APP_TYPES.WORKFLOW && !entity.slug) {
      await this.appRepository.update(entity.id, { slug: entity.id });
    }
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

    // Git-sync detection: presence of a default workspace branch row signals
    // git is on for this org. Workflows are exempt — they don't participate
    // in branching (branch_id always NULL), so the subscriber falls through
    // and picks their single VERSION row even when git is on for the org.
    const isWorkflow = app.type === APP_TYPES.WORKFLOW;
    let isGitEnabled = false;
    if (!isWorkflow) {
      const defaultBranch = await this.datasourceRepository.manager.findOne(WorkspaceBranch, {
        where: { organizationId: app.organizationId, isDefault: true },
        select: ['id'],
      });
      isGitEnabled = !!defaultBranch;
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
    // VERSION row. Every row has branch_id IS NULL in this mode, so this is
    // deterministic.
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
