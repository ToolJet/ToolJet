import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWorkSpaceStatusColumn1704258217404 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'status',
        type: 'enum',
        enumName: 'workspace_status',
        enum: ['active', 'archived'],
        default: `'active'`,
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
