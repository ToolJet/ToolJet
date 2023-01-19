import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addUserType1674131104527 implements MigrationInterface {
  // This migration is for customers upgrading CE to EE
  // User type is not added in CE, checking if user type exist in users table. If not adding same
  public async up(queryRunner: QueryRunner): Promise<void> {
    const userColumns = await queryRunner.query(
      "SELECT column_name FROM information_schema.columns where table_name = 'users'"
    );
    console.log(
      'available columns in users table ',
      userColumns?.map((uc) => uc.column_name)
    );
    if (!userColumns?.some((uc) => uc.column_name === 'user_type')) {
      console.log('adding user_type to users');
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
