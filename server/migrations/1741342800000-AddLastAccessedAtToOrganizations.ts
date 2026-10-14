import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastAccessedAtToOrganizations1741342800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'last_accessed_at',
        type: 'timestamp',
        isNullable: false,
        default: 'now()',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'last_accessed_at');
  }
}
