import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddUniqueConstraintToWorkspaceName1683136077244 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateWorkspaceNames(entityManager);
    await queryRunner.createUniqueConstraint(
      'organizations',
      new TableUnique({
        name: 'name_organizations_unique',
        columnNames: ['name'],
      })
    );
  }

  public async migrateWorkspaceNames(entityManager: EntityManager) {
    const workspaces = await entityManager.find(Organization);
    for (const workspace of workspaces) {
      const { name, id } = workspace;
      const sameNameWorkspaces = await entityManager.find(Organization, { name });
      if (sameNameWorkspaces.length > 1) {
        const workspacesToChange = sameNameWorkspaces.filter((workspace) => workspace.id !== id);
        for (const workspaceToChange of workspacesToChange) {
          await entityManager.update(
            Organization,
            { id: workspaceToChange.id },
            { name: `${workspaceToChange.name}_${Date.now()}` }
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
