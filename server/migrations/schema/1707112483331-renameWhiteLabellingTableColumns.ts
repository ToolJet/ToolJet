import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class RenameWhiteLabellingTableColumns1707112483331 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const datas = await queryRunner.query(`select * from "white_labelling"`);
    await queryRunner.query(`DROP TABLE "white_labelling"`);
    await queryRunner.createTable(
      new Table({
        name: 'white_labelling',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'favicon',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE'],
            isNullable: false,
            default: `'ACTIVE'`,
          },
        ],
      }),
      true
    );

    await queryRunner.createUniqueConstraint(
      'white_labelling',
      new TableUnique({
        columnNames: ['organization_id'],
      })
    );

    await queryRunner.createForeignKey(
      'white_labelling',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    if (datas?.length > 0) {
      let query = 'insert into "white_labelling" (id, organization_id, text, logo, favicon, status) values';

      for (let i = 0; i < datas.length; i++) {
        const data = datas[i];

        query += ` ('${data.id}', '${data.organizationId}', '${data.text}', '${data.logo}', '${data.favicon}', '${
          data.status
        }')${i === datas.length - 1 ? '' : ','}`;
      }
      await queryRunner.query(query);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
