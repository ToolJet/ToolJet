import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueDataSourceNamesPerOrganization1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    await queryRunner.startTransaction();

    try {
      const duplicateGroups: {
        organization_id: string;
        name: string;
        kind: string;
        count: number;
      }[] = await manager.query(`
        SELECT organization_id, name, kind, COUNT(*) as count
        FROM data_sources
        GROUP BY organization_id, name, kind
        HAVING COUNT(*) > 1
      `);

      for (const group of duplicateGroups) {
        const { organization_id: organizationId, name: baseName, kind } = group;

        const records: { id: string; created_at: Date }[] = await manager.query(
          `
            SELECT id, created_at
            FROM data_sources
            WHERE organization_id = $1
              AND name = $2
              AND kind = $3
            ORDER BY created_at ASC
          `,
          [organizationId, baseName, kind]
        );

        if (!records.length) {
          continue;
        }

        // Keep the oldest record unchanged
        const [, ...duplicates] = records;

        for (const record of duplicates) {
          let counter = 2;

          while (true) {
            const candidateName = `${baseName}_${counter}`;

            const existing = await manager.query(
              `
              SELECT 1
              FROM data_sources
              WHERE organization_id = $1
                AND name = $2
                AND kind = $3
              LIMIT 1
            `,
              [organizationId, candidateName, kind]
            );

            if (!existing.length) {
              await manager.query(
                `
                UPDATE data_sources
                SET name = $1,
                    updated_at = now()
                WHERE id = $2
              `,
                [candidateName, record.id]
              );

              console.log(`Renamed DataSource ${record.id} → ${candidateName}`);
              break;
            }

            counter++;
          }
        }
      }

      await queryRunner.query(`
        ALTER TABLE data_sources
        ADD CONSTRAINT unique_org_name_kind
        UNIQUE (organization_id, name, kind)
      `);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_sources
      DROP CONSTRAINT IF EXISTS unique_org_name_kind
    `);
  }
}