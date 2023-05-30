import { Organization } from 'src/entities/organization.entity';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddUniqueConstraintToWorkspaceName1683136077244 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateWorkspaceNames(entityManager);
    await queryRunner.createUniqueConstraint(
      'organizations',
      new TableUnique({
        name: DataBaseConstraints.WORKSPACE_NAME_UNIQUE,
        columnNames: ['name'],
      })
    );
  }

  public async migrateWorkspaceNames(entityManager: EntityManager) {
    const workspaces = await entityManager.query(
      'select sub_query.name from (select count(*) as name_count, name from organizations group by name) sub_query where name_count > 1    '
    );
    for (const workspace of workspaces) {
      const { name } = workspace;
      const sameNameWorkspaces = await entityManager.find(Organization, { name });
      for (const workspaceToChange of sameNameWorkspaces.slice(1)) {
        await entityManager.update(
          Organization,
          { id: workspaceToChange.id },
          { name: `${workspaceToChange.name} ${Date.now()}` }
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
