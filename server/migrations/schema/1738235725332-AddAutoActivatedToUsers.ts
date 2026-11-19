import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAutoActivatedToUsers1738235725332 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'auto_activated',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'auto_activated');
  }
}
