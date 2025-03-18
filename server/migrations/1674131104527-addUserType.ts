import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addUserType1674131104527 implements MigrationInterface {
  // This migration is for customers upgrading CE to EE
  // User type is not added in CE, checking if user type exist in users table. If not adding same
  public async up(queryRunner: QueryRunner): Promise<void> {
    const type = await queryRunner.query("SELECT 1 FROM pg_type WHERE typname = 'user_type'");
    if (!type?.length) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'user_type',
          type: 'enum',
          enumName: 'user_type',
          enum: ['instance', 'workspace'],
          default: `'workspace'`,
          isNullable: false,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
