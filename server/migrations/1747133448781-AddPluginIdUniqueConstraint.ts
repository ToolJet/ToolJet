import { MigrationInterface, QueryRunner, TableUnique } from "typeorm";

export class AddPluginIdUniqueConstraint1747133448781 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createUniqueConstraint(
            "plugins",
            new TableUnique({
                name: "UQ_plugin_pluginId",
                columnNames: ["plugin_id"],
            })
        ); 
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint(
            "plugins",
            "UQ_plugin_pluginId"
        );
    }

}
