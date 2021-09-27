import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddSsoIdToUser1632047749315 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("users", new TableColumn({
            name: "sso_id",
            type: "varchar",
            isNullable: true,
        }));

        await queryRunner.createIndex("users", new TableIndex({
            name: "IDX_SSO_ID",
            columnNames: ["sso_id"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("users", "IDX_SSO_ID");
        await queryRunner.dropColumn("users", "sso_id");
    }
}
