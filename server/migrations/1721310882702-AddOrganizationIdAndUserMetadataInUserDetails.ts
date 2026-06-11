import { MigrationInterface, QueryRunner, TableColumn, TableUnique, TableForeignKey } from 'typeorm';

export class AddOrganizationIdAndUserMetadataInUserDetails1721310882702 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_details',
      new TableColumn({
        name: 'user_metadata',
        type: 'varchar (30000)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'user_details',
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Removing the old unique constraint on user_id
    await queryRunner.dropUniqueConstraint('user_details', 'user_details_user_id_unique');

    // Add unique constraint on organization_id and user_id
    await queryRunner.createUniqueConstraint(
      'user_details',
      new TableUnique({
        name: 'UQ_user_details_organization_user',
        columnNames: ['organization_id', 'user_id'],
      })
    );

    // Add foreign key constraint for organization_id
    await queryRunner.createForeignKey(
      'user_details',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
