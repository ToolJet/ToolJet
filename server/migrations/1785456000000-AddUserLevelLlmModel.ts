import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserLevelLlmModel1785456000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Per-user model preference, keyed on the same membership row as llm_provider
    // (AddUserLevelLlmPreference). The context window is captured at selection time so the
    // session meter can draw before the first response, exactly like the org-level model.
    //
    // No CHECK on llm_model: the allowed set is PROVIDER_MODEL_CATALOG in ee/ai/util.service.ts,
    // enforced on write and again on read, so pinning it here would turn a catalogue edit into a
    // migration.
    await queryRunner.addColumn(
      'organization_users',
      new TableColumn({ name: 'llm_model', type: 'varchar', length: '200', isNullable: true })
    );

    await queryRunner.addColumn(
      'organization_users',
      new TableColumn({ name: 'llm_model_context_window', type: 'integer', isNullable: true })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organization_users', 'llm_model_context_window');
    await queryRunner.dropColumn('organization_users', 'llm_model');
  }
}
