import { DATA_BASE_CONSTRAINTS } from '@modules/group-permissions/constants/error';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupPermissionsTable1714015513342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
       CREATE TYPE group_permissions_type AS ENUM ('custom', 'default');
        `
    );

    //Remove data source level permissions in CE
    await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS permission_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        name VARCHAR(50) NOT NULL,
        type group_permissions_type NOT NULL DEFAULT 'custom',
        app_create BOOLEAN DEFAULT false,
        app_delete BOOLEAN DEFAULT false,
        folder_crud BOOLEAN DEFAULT false,
        org_constant_crud BOOLEAN DEFAULT false,
        data_source_create BOOLEAN DEFAULT false,
        data_source_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT ${DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE.dbConstraint} UNIQUE (organization_id, name)
    );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS permission_groups`);
    await queryRunner.query(`DROP TYPE IF EXISTS group_permissions_type;`);
  }
}
