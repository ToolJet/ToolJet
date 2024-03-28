import { Entity, AfterLoad, AfterInsert, getRepository, getManager } from 'typeorm';
import { AppVersion } from './app_version.entity';
import { AppBase } from './app_base.entity';

@Entity({ name: 'apps' })
export class App extends AppBase {
  public editingVersion;

  @AfterInsert()
  async updateSlug(): Promise<void> {
    if (!this.slug) {
      const appRepository = getRepository(App);
      await appRepository.update(this.id, { slug: this.id });
    }
  }

  @AfterLoad()
  async afterLoad(): Promise<void> {
    this.editingVersion = await getManager().findOne(AppVersion, {
      where: { appId: this.id },
      order: { updatedAt: 'DESC' },
    });
  }
}
