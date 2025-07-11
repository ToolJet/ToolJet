import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAiGenerationFlagsInApp1748331051836 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_initialised_from_prompt column
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'is_initialised_from_prompt',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    // Add app_generated_from_prompt column
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'app_generated_from_prompt',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    // Add ai_generation_metadata column
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'ai_generation_metadata',
        type: 'jsonb',
        isNullable: true,
      })
    );

    // Create app_builder_mode enum type
    await queryRunner.query(`CREATE TYPE "app_builder_mode" AS ENUM ('ai', 'visual')`);

    // Add app_builder_mode column
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'app_builder_mode',
        type: 'app_builder_mode',
        default: "'visual'",
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('apps', 'app_builder_mode');
    await queryRunner.query('DROP TYPE "app_builder_mode"');
    await queryRunner.dropColumn('apps', 'ai_generation_metadata');
    await queryRunner.dropColumn('apps', 'app_generated_from_prompt');
    await queryRunner.dropColumn('apps', 'is_initialised_from_prompt');
  }
}
