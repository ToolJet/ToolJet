import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Not } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { AppBase } from 'src/entities/app_base.entity';
import { AppVersionType } from 'src/entities/app_version.entity';
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
    if (!entity.slug) {
      await this.appRepository.update(entity.id, { slug: entity.id });
    }
  }

  async afterLoad(app: any): Promise<void> {
    if (!(app instanceof App) && !(app instanceof AppBase)) return;
    if (!app || (app as any).__loaded) return;

    (app as any).__loaded = true;

    let editingVersion = await this.appVersionRepository.findOne({
      where: { appId: app.id, versionType: Not(AppVersionType.BRANCH), isStub: false },
      order: { updatedAt: 'DESC' },
    });

    // Apps created on a feature branch only have a BRANCH-type version — fall back to it
    if (!editingVersion) {
      editingVersion = await this.appVersionRepository.findOne({
        where: { appId: app.id, versionType: AppVersionType.BRANCH },
        order: { updatedAt: 'DESC' },
      });
    }

    if (!editingVersion) {
      (app as any).isStub = true;
      return;
    }

    (app as any).isStub = false;
    (app as any).editingVersion = editingVersion;

    if (app.type !== 'workflow') {
      // icon and is_public exist on every version
      if (editingVersion.icon !== undefined) (app as any).icon = editingVersion.icon;
      if (editingVersion.isPublic !== undefined) (app as any).isPublic = editingVersion.isPublic;

      if (editingVersion.versionType === AppVersionType.BRANCH) {
        // This IS the BRANCH version — read slug/appName directly
        if (editingVersion.slug) (app as any).slug = editingVersion.slug;
        if (editingVersion.appName) (app as any).name = editingVersion.appName;
      } else if (editingVersion.branchId) {
        // VERSION-type on a branch — look up the sibling BRANCH version for slug/appName
        const branchVersion = await this.appVersionRepository.findOne({
          where: { appId: app.id, versionType: AppVersionType.BRANCH, branchId: editingVersion.branchId },
        });
        if (branchVersion) {
          if (branchVersion.slug) (app as any).slug = branchVersion.slug;
          if (branchVersion.appName) (app as any).name = branchVersion.appName;
        }
      } else {
        // Non-git-sync: slug/appName on the VERSION itself
        if (editingVersion.slug) (app as any).slug = editingVersion.slug;
        if (editingVersion.appName) (app as any).name = editingVersion.appName;
      }
    }
  }
}
