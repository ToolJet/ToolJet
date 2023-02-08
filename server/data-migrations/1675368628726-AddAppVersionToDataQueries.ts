import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAppVersionToDataQueries1675368628727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_queries',
      new TableColumn({
        name: 'app_version_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'data_queries',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
      })
    );

    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, {
      select: ['id', 'name'],
    });

    for (const organization of organizations) {
      const apps = await entityManager.find(App, {
        where: { organizationId: organization.id },
      });
      for (const app of apps) {
        await this.insertAppVersionToQueries(app, entityManager);
      }
    }
  }

  async insertAppVersionToQueries(app: App, entityManager: EntityManager) {
    const appVersions = await entityManager.find(AppVersion, {
      where: { appId: app.id },
      order: { createdAt: 'ASC' },
    });

    for (const appVersion of appVersions) {
      const dataSources = await entityManager.query('select * from data_sources where app_version_id = $1', [
        appVersion.id,
      ]);
      for (const dataSource of dataSources) {
        const dataQueries = await entityManager.find(DataQuery, {
          where: { dataSourceId: dataSource.id, appVersionId: null },
        });
        if (dataQueries?.length) {
          await entityManager.query(
            `update data_queries set app_version_id = $1 where id IN(${dataQueries.map((dq) => `'${dq.id}'`)?.join()})`,
            [appVersion.id]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
