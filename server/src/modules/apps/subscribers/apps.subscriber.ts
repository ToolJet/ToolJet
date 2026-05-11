import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Not } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { AppVersionType } from 'src/entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';

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

  async afterLoad(app: any): Promise<void> {
    // Only fire for App entity loads (single-app/editor paths). AppBase is used by
    // list/admin queries (e.g. /api/folder-apps, /api/apps listing) where the per-row
    // editingVersion lookup would amount to N+1; those callers resolve metadata via
    // explicit JOINs instead.
    if (!(app instanceof App)) return;
    if (!app || (app as any).__loaded) return;

    (app as any).__loaded = true; // mark entity as processed

    // Prefer VERSION-type versions (canonical, user-named) over BRANCH-type versions.
    // With the new single-App-per-logical-app model, multiple branches share one App
    // entity. Without this filter the most-recently-updated BRANCH-type version from
    // any branch could be returned here, giving the wrong context to callers that have
    // no branch information (e.g. background jobs, non-git-sync paths).
    // Branch-specific context is layered on top by the service layer when a branchId
    // is available (see EE AppsService.getOne).
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
