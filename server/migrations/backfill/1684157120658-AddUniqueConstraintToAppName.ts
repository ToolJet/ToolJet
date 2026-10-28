import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { addWait } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner, TableUnique, EntityManager } from 'typeorm';

export class AddUniqueConstraintToAppName1684145489093 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateAppNames(entityManager);
    await queryRunner.createUniqueConstraint(
      'apps',
      new TableUnique({
        name: DataBaseConstraints.APP_NAME_UNIQUE,
        columnNames: ['name', 'organization_id'],
      })
    );
  }

  public async migrateAppNames(entityManager: EntityManager) {
    const workspaces = await entityManager.find(Organization);
    for (const workspace of workspaces) {
      const { id: organizationId } = workspace;
      const apps = await entityManager.query(
        'select sub_query.name from (select count(*) as name_count, name from apps where organization_id=$1 group by name) sub_query where name_count > 1    ',
        [organizationId]
      );
      for (const app of apps) {
        console.log('Found ' + apps.length + ' apps with same name');
        const { name } = app;
        const sameApps = await entityManager.query(
          'select id, name from apps where name = $1 and organization_id = $2',
          [name, organizationId]
        );
        for (const appToChange of sameApps.slice(1)) {
          console.log('Renaming app id: ' + appToChange.id + ' name: ' + appToChange.name);

          await entityManager.update(App, { id: appToChange.id }, { name: `${appToChange.name} ${Date.now()}` });
          // Add 1 millisecond wait to prevent duplicate timestamp generation
          addWait(1);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
