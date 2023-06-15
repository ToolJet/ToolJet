import { Organization } from 'src/entities/organization.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillAppEnvironmentsPriorityColumn1686826460358 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //backfill new columns
    await this.backFillPriorityColumn(queryRunner.manager);
  }

  async backFillPriorityColumn(manager: EntityManager) {
    const organizations = await Organization.find({
      select: ['id', 'appEnvironments'],
      relations: ['appEnvironments'],
    });

    for (const { appEnvironments } of organizations) {
      for (const appEnvironment of appEnvironments) {
        console.log('Updating app environment =>', appEnvironment.id);
        const priority = defaultAppEnvironments.find(
          (defaultAppEnvironment) => defaultAppEnvironment.name === appEnvironment.name
        ).priority;
        await manager.query('UPDATE app_environments SET priority = $1 WHERE id = $2;', [priority, appEnvironment.id]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
