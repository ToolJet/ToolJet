import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillLegacyInputSizeProperty1784874333000';
const COMPONENT_TYPES = [
  'TextInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'NumberInput',
  'Cascader',
  'TextArea',
];

export class BackfillLegacyInputSizeProperty1784874333000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = ANY($1)
         AND (
           properties IS NULL
           OR NOT (properties::jsonb ? 'legacyInputSize')
         )`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total: ${total}`);

    await queryRunner.query(
      `UPDATE components
       SET properties = CASE
         WHEN properties IS NULL THEN jsonb_build_object('legacyInputSize', jsonb_build_object('value', '{{true}}'))::json
         ELSE (properties::jsonb || jsonb_build_object('legacyInputSize', jsonb_build_object('value', '{{true}}')))::json
       END
       WHERE type = ANY($1)
         AND (
           properties IS NULL
           OR NOT (properties::jsonb ? 'legacyInputSize')
         )`,
      [COMPONENT_TYPES]
    );

    console.log(`${MIGRATION_NAME}: [SUCCESS] Finished.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op - data migrations are not reversed.
  }
}
