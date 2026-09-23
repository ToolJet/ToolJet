import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddOrganizationAndAppToApprovalRequests1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Backfill existing rows through the join chain the columns replace.
    await queryRunner.query(`
      UPDATE workflow_approval_requests r
      SET organization_id = a.organization_id, app_id = a.id
      FROM workflow_executions e
      JOIN app_versions av ON av.id = e.app_version_id
      JOIN apps a         ON a.id  = av.app_id
      WHERE e.id = r.workflow_execution_id
    `);

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
