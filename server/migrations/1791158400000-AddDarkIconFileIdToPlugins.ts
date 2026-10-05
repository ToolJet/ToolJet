import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddDarkIconFileIdToPlugins1791158400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'plugins',
      new TableColumn({
        name: 'dark_icon_file_id',
        type: 'uuid',
        isNullable: true,
      })
    );
    // SET NULL, not CASCADE: the dark icon is optional, so losing its file leaves
    // the plugin installed and showing its normal icon.
    await queryRunner.createForeignKey(
      'plugins',
      new TableForeignKey({
        columnNames: ['dark_icon_file_id'],
        referencedTableName: 'files',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('plugins', 'dark_icon_file_id');
  }
}
