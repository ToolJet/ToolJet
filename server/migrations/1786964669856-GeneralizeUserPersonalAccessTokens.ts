import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';


export class GeneralizeUserPersonalAccessTokens1786964669856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`DELETE FROM user_personal_access_tokens WHERE scope = 'workspace'`);

    
    await queryRunner.addColumns('user_personal_access_tokens', [
      new TableColumn({ name: 'organization_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'name', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'last_used_at', type: 'timestamptz', isNullable: true }),
    ]);
    await queryRunner.createForeignKey(
      'user_personal_access_tokens',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // expires_at stays NOT NULL for BOTH species — workspace PATs always expire (presets only).
    await queryRunner.query(
      `ALTER TABLE user_personal_access_tokens
         ADD CONSTRAINT check_user_pat_app_shape
         CHECK (scope <> 'app' OR app_id IS NOT NULL)`
    );
    await queryRunner.query(
      `ALTER TABLE user_personal_access_tokens
         ADD CONSTRAINT check_user_pat_workspace_shape
         CHECK (scope <> 'workspace' OR organization_id IS NOT NULL)`
    );

   
    await queryRunner.createIndex(
      'user_personal_access_tokens',
      new TableIndex({ name: 'IDX_user_pat_token_hash', columnNames: ['token_hash'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_personal_access_tokens DROP CONSTRAINT IF EXISTS check_user_pat_workspace_shape`);
    await queryRunner.query(`ALTER TABLE user_personal_access_tokens DROP CONSTRAINT IF EXISTS check_user_pat_app_shape`);
    await queryRunner.dropIndex('user_personal_access_tokens', 'IDX_user_pat_token_hash');
    await queryRunner.query(`DELETE FROM user_personal_access_tokens WHERE scope = 'workspace'`);
    const table = await queryRunner.getTable('user_personal_access_tokens');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('organization_id'));
    if (fk) await queryRunner.dropForeignKey('user_personal_access_tokens', fk);
    await queryRunner.dropColumns('user_personal_access_tokens', ['organization_id', 'name', 'last_used_at']);
  }
}
