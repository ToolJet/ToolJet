import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1773229181000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const duplicateGroups = await manager.query(`
      SELECT 
        LOWER(name) as lower_name,
        COALESCE(branch_id, '00000000-0000-0000-0000-000000000000') as effective_branch_id
      FROM data_source_versions
      WHERE is_active = true AND is_default = false
      GROUP BY LOWER(name), COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
      HAVING COUNT(*) > 1
    `);

    for (const { lower_name, effective_branch_id } of duplicateGroups) {
      const records = await manager.query(
        `
        SELECT id, name
        FROM data_source_versions
        WHERE LOWER(name) = $1
          AND COALESCE(branch_id, '00000000-0000-0000-0000-000000000000') = $2
          AND is_active = true
          AND is_default = false
        ORDER BY created_at ASC
      `,
        [lower_name, effective_branch_id]
      );

      if (records.length <= 1) continue;

      for (let i = 1; i < records.length; i++) {
        const record = records[i];
        const baseName = record.name.replace(/_\d+$/, '');
        let counter = 2;

        while (true) {
          const candidate = `${baseName}_${counter}`;

          const exists = await manager.query(
            `
            SELECT 1
            FROM data_source_versions
            WHERE LOWER(name) = LOWER($1)
              AND COALESCE(branch_id, '00000000-0000-0000-0000-000000000000') = $2
              AND is_active = true
              AND is_default = false
            LIMIT 1
          `,
            [candidate, effective_branch_id]
          );

          if (!exists.length) {
            await manager.query(
              `
              UPDATE data_source_versions
              SET name = $1, updated_at = now()
              WHERE id = $2
            `,
              [candidate, record.id]
            );
            break;
          }

          counter++;
        }
      }
    }

    await manager.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
      ON data_source_versions (
        LOWER(name),
        COALESCE(branch_id, '00000000-0000-0000-0000-000000000000')
      )
      WHERE is_active = true AND is_default = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_active_name_branch
    `);
  }
}