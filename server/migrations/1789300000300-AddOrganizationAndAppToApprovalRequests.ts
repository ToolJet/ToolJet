// migration-lint: allow-destructive the foreign keys only cover nullable columns this migration adds
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddOrganizationAndAppToApprovalRequests1789300000300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('workflow_approval_requests', 'organization_id')) return;

    await queryRunner.addColumns('workflow_approval_requests', [
      new TableColumn({ name: 'organization_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'app_id', type: 'uuid', isNullable: true }),
    ]);

    await queryRunner.createForeignKeys('workflow_approval_requests', [
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedTableName: 'apps',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // Supports: WHERE organization_id = $1 ORDER BY created_at DESC LIMIT n
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_created
      ON workflow_approval_requests(organization_id, created_at DESC)
    `);
    // Supports the same, narrowed by workflow.
    await queryRunner.query(`
      CREATE INDEX idx_workflow_approval_requests_org_app_created
      ON workflow_approval_requests(organization_id, app_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_approval_requests_org_app_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_approval_requests_org_created`);

    const table = await queryRunner.getTable('workflow_approval_requests');
    for (const col of ['organization_id', 'app_id']) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes(col));
      if (fk) await queryRunner.dropForeignKey('workflow_approval_requests', fk);
    }
    await queryRunner.dropColumns('workflow_approval_requests', ['organization_id', 'app_id']);
  }
}
