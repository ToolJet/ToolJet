import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerBranch1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    await queryRunner.startTransaction();

    try {
      // Find duplicates among ACTIVE versions
      const duplicateGroups: {
        name: string;
        branch_id: string | null;
        count: number;
      }[] = await manager.query(`
        SELECT LOWER(name) as name, branch_id, COUNT(*) as count
        FROM data_source_versions
        WHERE is_active = true
        GROUP BY LOWER(name), branch_id
        HAVING COUNT(*) > 1
      `);

      for (const group of duplicateGroups) {
        const { name: lowerName, branch_id } = group;

        // Fetch actual records (ordered)
        const records: { id: string; name: string; created_at: Date }[] = await manager.query(
          `
          SELECT id, name, created_at
          FROM data_source_versions
          WHERE LOWER(name) = $1
            AND is_active = true
            AND ${
              branch_id ? 'branch_id = $2' : 'branch_id IS NULL'
            }
          ORDER BY created_at ASC
        `,
          branch_id ? [lowerName, branch_id] : [lowerName]
        );

        if (!records.length) continue;

        const baseName = records[0].name;

        // Keep first, rename rest
        const [, ...duplicates] = records;

        for (const record of duplicates) {
          let counter = 2;

          while (true) {
            const candidateName = `${baseName}_${counter}`;

            const existing = await manager.query(
              `
              SELECT 1
              FROM data_source_versions
              WHERE LOWER(name) = LOWER($1)
                AND is_active = true
                AND ${
                  branch_id ? 'branch_id = $2' : 'branch_id IS NULL'
                }
              LIMIT 1
            `,
              branch_id ? [candidateName, branch_id] : [candidateName]
            );

            if (!existing.length) {
              await manager.query(
                `
                UPDATE data_source_versions
                SET name = $1,
                    updated_at = now()
                WHERE id = $2
              `,
                [candidateName, record.id]
              );
              break;
            }

            counter++;
          }
        }
      }

      // Add UNIQUE INDEX (partial index)
      await queryRunner.query(`
        CREATE UNIQUE INDEX idx_unique_active_name_branch
        ON data_source_versions (LOWER(name), branch_id)
        WHERE is_active = true
      `);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_unique_active_name_branch
    `);
  }
}