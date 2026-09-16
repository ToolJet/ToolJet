import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAiRunCancellation1788820000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('ai_active_runs', new TableColumn({
      name: 'cancel_requested', type: 'boolean', default: false,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('ai_active_runs', 'cancel_requested');
  }
}
