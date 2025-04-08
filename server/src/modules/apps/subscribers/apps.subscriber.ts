import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';

@EventSubscriber()
export class AppsSubscriber implements EntitySubscriberInterface<App> {
  constructor(
    private readonly appVersionRepository: VersionRepository,
    private readonly appRepository: AppsRepository,
    private readonly datasourceRepository: DataSource
  ) {
    datasourceRepository.subscribers.push(this);
  }

  listenTo() {
    return App;
  }

  async afterInsert(event: InsertEvent<App>): Promise<void> {
    const app = event.entity;
    if (!app.slug) {
      await this.appRepository.update(app.id, { slug: app.id });
    }
  }

  async afterLoad(app: App): Promise<void> {
    if (app) {
      app.editingVersion = await this.appVersionRepository.findOne({
        where: { appId: app.id },
        order: { updatedAt: 'DESC' },
      });
    }
  }
}
