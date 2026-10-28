import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSourceToOrganizationUsers1716975639914 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organization_users', [
      new TableColumn({
        name: 'source',
        type: 'enum',
        enumName: 'source',
        enum: ['signup', 'invite'],
        default: `'invite'`,
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('organization_users', ['source']);
  }
}
