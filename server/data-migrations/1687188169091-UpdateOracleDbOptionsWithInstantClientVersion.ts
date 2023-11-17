import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { In, MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOracleDbOptionsWithInstantClientVersion1687188169091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    let progress = 0;

    const dataSources = await entityManager.find(DataSource, {
      where: { kind: 'oracledb' },
      select: ['id'],
    });

    const dataSourceOptions = await entityManager.find(DataSourceOptions, {
      where: { dataSourceId: In(dataSources.map((d) => d.id)) },
      select: ['id', 'options'],
    });

    for (const dataSourceOption of dataSourceOptions) {
      progress++;

      console.log(
        `UpdateOracleDbOptionsWithInstantClientVersion1687188169091 Progress ${Math.round(
          (progress / dataSourceOptions.length) * 100
        )} %`
      );

      if (dataSourceOption.options?.instant_client_version) continue;

      dataSourceOption.options = {
        ...dataSourceOption.options,
        instant_client_version: { value: '21_10', encrypted: false },
      };

      await entityManager.save(dataSourceOption);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
