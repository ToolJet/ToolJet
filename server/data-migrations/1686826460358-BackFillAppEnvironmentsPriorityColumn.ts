import { Organization } from 'src/entities/organization.entity';
import { defaultAppEnvironments, MigrationProgress } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class BackFillAppEnvironmentsPriorityColumn1686826460358 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //backfill new columns
    await this.backFillPriorityColumn(queryRunner.manager);

    await queryRunner.createUniqueConstraint(
      'app_environments',
      new TableUnique({
        name: 'unique_organization_id_priority',
        columnNames: ['organization_id', 'priority'],
      })
    );
  }

  async backFillPriorityColumn(manager: EntityManager) {
    const organizations = await manager
      .createQueryBuilder(Organization, 'organizations')
      .leftJoinAndSelect('organizations.appEnvironments', 'appEnvironments')
      .getMany();

    const migrationProgress = new MigrationProgress(
      'BackFillAppEnvironmentsPriorityColumn1686826460358',
      organizations.length
    );

    for (const { appEnvironments } of organizations) {
      for (const appEnvironment of appEnvironments) {
        const priority = defaultAppEnvironments.find(
          (defaultAppEnvironment) => defaultAppEnvironment.name === appEnvironment.name
        ).priority;
        await manager.query('UPDATE app_environments SET priority = $1 WHERE id = $2;', [priority, appEnvironment.id]);
      }
      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('app_environments', 'unique_organization_id_priority');
  }
}
