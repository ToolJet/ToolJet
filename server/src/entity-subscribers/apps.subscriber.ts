import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';

@EventSubscriber()
export class AppsSubscriber implements EntitySubscriberInterface<App> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(AppVersion)
    private readonly appVersionRepository: Repository<AppVersion>,
    @InjectRepository(App)
    private readonly appRepository: Repository<App>
  ) {
    dataSource.subscribers.push(this);
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
