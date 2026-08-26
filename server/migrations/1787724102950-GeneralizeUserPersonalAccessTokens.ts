import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';


export class GeneralizeUserPersonalAccessTokens1787724102950 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`DELETE FROM user_personal_access_tokens WHERE scope = 'workspace'`);

    
    await queryRunner.addColumns('user_personal_access_tokens', [
      new TableColumn({ name: 'organization_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'name', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'last_used_at', type: 'timestamptz', isNullable: true }),
      // Marks a row as minted programmatically by the backend on a user's behalf (e.g. the AI
      // app-builder's find-or-create service token), as opposed to one a human created by hand
      // through the PAT settings UI. Only this subset is meant to behave as a per-(user,
      // workspace, name) singleton — see IDX_user_pat_service_identity below — so the flag has to
      // exist before that index can be scoped to it.
      new TableColumn({ name: 'is_service_token', type: 'boolean', isNullable: false, default: false }),
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

    // Enforces the find-or-create in getOrCreateServicePat as a true DB-level singleton per
    // (user, workspace, name) — closing a race where two concurrent calls could otherwise both
    // pass the existence check and insert duplicate service tokens. Scoped to is_service_token so
    // human-created PATs (which can legitimately share names) are untouched.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_pat_service_identity"
         ON user_personal_access_tokens (user_id, organization_id, name)
         WHERE is_service_token = true`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_pat_service_identity"`);
    await queryRunner.query(`ALTER TABLE user_personal_access_tokens DROP CONSTRAINT IF EXISTS check_user_pat_workspace_shape`);
    await queryRunner.query(`ALTER TABLE user_personal_access_tokens DROP CONSTRAINT IF EXISTS check_user_pat_app_shape`);
    await queryRunner.dropIndex('user_personal_access_tokens', 'IDX_user_pat_token_hash');
    await queryRunner.query(`DELETE FROM user_personal_access_tokens WHERE scope = 'workspace'`);
    const table = await queryRunner.getTable('user_personal_access_tokens');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('organization_id'));
    if (fk) await queryRunner.dropForeignKey('user_personal_access_tokens', fk);
    await queryRunner.dropColumns('user_personal_access_tokens', [
      'organization_id',
      'name',
      'last_used_at',
      'is_service_token',
    ]);
  }
}
