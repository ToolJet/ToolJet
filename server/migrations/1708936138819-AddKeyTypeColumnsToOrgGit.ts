import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddKeyTypeColumnToOrgGitTable1708320592518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_git_sync',
      new TableColumn({
        name: 'key_type',
        type: 'enum',
        enumName: 'ssh_key_type',
        enum: ['rsa', 'ed25519'],
        default: `'ed25519'`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
