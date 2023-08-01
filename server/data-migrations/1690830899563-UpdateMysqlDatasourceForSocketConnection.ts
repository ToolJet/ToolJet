import { DataSource } from 'src/entities/data_source.entity';
import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';

export class UpdateMysqlDatasourceForSocketConnection1690830899563 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const dataSourceIds = (
      await entityManager.find(DataSource, {
        where: { kind: 'mysql' },
        select: ['id'],
      })
    ).map((d) => d.id);

    const migrationProgress = new MigrationProgress(
      'UpdateMysqlDatasourceForSocketConnection1690830899563',
      dataSourceIds.length
    );

    const getDataSourceOptionsToUpdate = async (
      entityManager: EntityManager,
      skip: number,
      take: number
    ): Promise<DataSourceOptions[]> => {
      return await entityManager.find(DataSourceOptions, {
        where: { dataSourceId: In(dataSourceIds) },
        take,
        skip,
      });
    };

    const processDataSourceOptionsBatch = async (
      entityManager: EntityManager,
      dataSourceOptions: DataSourceOptions[]
    ): Promise<void> => {
      for (const dataSourceOption of dataSourceOptions) {
        if (dataSourceOption.options.connection_type) {
          migrationProgress.show();
          continue;
        }

        dataSourceOption.options = {
          ...dataSourceOption.options,
          connection_type: { value: 'hostname', encrypted: false },
        };

        await entityManager.save(dataSourceOption);
        migrationProgress.show();
      }
    };

    await processDataInBatches(entityManager, getDataSourceOptionsToUpdate, processDataSourceOptionsBatch);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
