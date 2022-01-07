import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDefaultAppVersionForApps1641546739091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const appsWithoutVersions = await manager
      .createQueryBuilder(App, 'apps')
      .leftJoin('apps.appVersions', 'app_versions')
      .where('app_versions.app_id is NULL')
      .getMany();

    for (const app of appsWithoutVersions) {
      const version = manager.create(AppVersion, {
        name: 'default',
        appId: app.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await manager.save(AppVersion, version);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
