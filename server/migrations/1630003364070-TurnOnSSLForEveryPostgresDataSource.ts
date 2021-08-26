import {MigrationInterface, QueryRunner} from "typeorm";
import { DataSource } from "../src/entities/data_source.entity";

export class TurnOnSSLForEveryPostgresDataSource1630003364070 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const dataSourceRepository = entityManager.getRepository(DataSource);

    const dataSources = await dataSourceRepository.find();

    for(const dataSource of dataSources) {
      if(dataSource.kind === 'postgres') {
        const options = dataSource.options;

        if(options) {
          options['ssl_enabled'] = { value: true, encrypted: false };
          await queryBuilder.update(DataSource)
          .set({ options })
          .where('id = :id', { id: dataSource.id })
          .execute();
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
