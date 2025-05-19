import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

export class AddSessionTypeAndPatIdToUserSessions1746728003499 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_sessions',
      new TableColumn({
        name: 'session_type',
        type: 'enum',
        enum: ['user', 'pat'],
        default: `'user'`,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'user_sessions',
      new TableColumn({
        name: 'pat_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'user_sessions',
      new TableForeignKey({
        columnNames: ['pat_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_personal_access_tokens',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
