import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBannerImageToWhiteLabelling1778760592536 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'white_labelling',
            new TableColumn({
                name: 'banner_image',
                type: 'varchar',
                length: '1024',
                isNullable: true,
                default: null,
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('white_labelling', 'banner_image');
    }

}
