import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSpecFilesMapToPlugins1775060000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'plugins',
      new TableColumn({
        name: 'spec_files_map',
        type: 'jsonb',
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('plugins', 'spec_files_map');
  }
}
