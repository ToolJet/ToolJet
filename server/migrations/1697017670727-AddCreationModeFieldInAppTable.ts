import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCreationModeFieldInAppTable1697017670727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('apps', [
      new TableColumn({
        name: 'creation_mode',
        type: 'enum',
        enumName: 'app_creation_mode',
        enum: ['GIT', 'DEFAULT'],
        default: `'DEFAULT'`,
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
