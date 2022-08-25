import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class AddOrganizationIdToDataSources1661342016413 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(
        'data_sources',
        new TableColumn({
          name: 'organization_id',
          type: 'uuid',
          isNullable: true,
        })
      );

      await queryRunner.createForeignKey(
        'data_sources',
        new TableForeignKey({
          columnNames: ['organization_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'organizations',
        })
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn('data_sources', 'organization_id');
    }

}
