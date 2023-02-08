import { AppEnvironment } from 'src/entities/app_environments.entity';
import { Organization } from 'src/entities/organization.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class MigrateEnvironmentsUnderWorkspace1675844361118 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, {
      select: ['id', 'name'],
    });

    await this.dropForeignKey('app_environments', 'app_version_id', queryRunner);
    await queryRunner.query('alter table app_environments alter column app_version_id drop not null');

    //Insert new environments under workspace
    const newMappingForEnvironments = {};
    for (const org of organizations) {
      for (const { name, isDefault } of defaultAppEnvironments) {
        const environment: AppEnvironment = await entityManager.save(
          entityManager.create(AppEnvironment, {
            name,
            isDefault,
            organizationId: org.id,
          })
        );
        newMappingForEnvironments[name] = {
          ...newMappingForEnvironments[name],
          [org.id]: environment.id,
        };
      }
    }

    //Retrieve old environments under app_versions
    const oldMappingForEnvironments = {};
    for (const org of organizations) {
      for (const { name } of defaultAppEnvironments) {
        const envs = await queryRunner.query(
          `select app_environments.id from app_versions inner join apps on apps.organization_id = $1
                 inner join app_environments on app_environments.app_version_id = app_versions.id
                  where app_versions.app_id = apps.id and app_environments.name=$2`,
          [org.id, name]
        );
        console.log({ envs });
        oldMappingForEnvironments[name] = {
          ...oldMappingForEnvironments[name],
          [org.id]: envs,
        };
      }
    }

    //Update datasources options from old and new mapping
    for (const org of organizations) {
      for (const { name } of defaultAppEnvironments) {
        console.log(oldMappingForEnvironments[name][org.id]);
        await queryRunner.query(
          `update data_source_options set environment_id = $1
                 where environment_id IN (${oldMappingForEnvironments[name][org.id]
                   .map((env) => `'${env.id}'`)
                   ?.join()})`,
          [newMappingForEnvironments[name][org.id]]
        );
      }
    }

    //Delete old app_environments which are not under organizations
    await entityManager.delete(AppEnvironment, { organizationId: null });

    //Add Foreing key and delete constraints on organization_id column
    await queryRunner.createForeignKey(
      'app_environments',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    //Drop app_version_id column as it is no longer needed
    await queryRunner.dropColumn('app_environments', 'app_version_id');
  }

  private async dropForeignKey(tableName: string, columnName: string, queryRunner) {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf(columnName) !== -1);
    await queryRunner.dropForeignKey(tableName, foreignKey);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
