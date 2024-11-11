import { DataSource } from '@entities/data_source.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { MigrationProgress } from '@helpers/migration.helper';
import { processDataInBatches } from '@helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateManualConnectionTypeForOldPostgresDs1731283187529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const batchSize = 100;
    const datasourceOptionsCount = await entityManager
      .createQueryBuilder(DataSourceOptions, 'dso')
      .innerJoin(DataSource, 'ds', 'dso.dataSourceId = ds.id')
      .where('ds.kind = :kind', { kind: 'postgresql' })
      .andWhere(
        `
        NOT EXISTS (
          SELECT 1
          FROM jsonb_object_keys(dso.options::jsonb) AS keys
          WHERE keys = 'connection_type'
        )
      `
      )
      .getCount();

    const migrationProgress = new MigrationProgress(
      'PopulateManualConnectionTypeForOldPostgresDs1731283187529',
      datasourceOptionsCount
    );

    const getDataSourceOptionsToUpdate = async (
      entityManager: EntityManager,
      skip: number,
      take: number
    ): Promise<DataSourceOptions[]> => {
      return await entityManager
        .createQueryBuilder(DataSourceOptions, 'dso')
        .innerJoin(DataSource, 'ds', 'dso.dataSourceId = ds.id')
        .where('ds.kind = :kind', { kind: 'postgresql' })
        .andWhere(
          `
          NOT EXISTS (
            SELECT 1
            FROM jsonb_object_keys(dso.options::jsonb) AS keys
            WHERE keys = 'connection_type'
          )
        `
        )
        .skip(skip)
        .take(take)
        .getMany();
    };

    const processDataSourceOptionsBatch = async (
      entityManager: EntityManager,
      dataSourceOptions: DataSourceOptions[]
    ): Promise<void> => {
      for (const dataSourceOption of dataSourceOptions) {
        if (dataSourceOption.options?.connection_type) {
          migrationProgress.show();
          continue;
        }

        dataSourceOption.options = {
          ...dataSourceOption.options,
          connection_type: { value: 'manual', encrypted: false },
        };

        await entityManager.save(dataSourceOption);
        migrationProgress.show();
      }
    };

    await processDataInBatches(entityManager, getDataSourceOptionsToUpdate, processDataSourceOptionsBatch, batchSize);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
