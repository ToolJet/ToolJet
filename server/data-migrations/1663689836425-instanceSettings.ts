import { MigrationInterface, QueryRunner } from 'typeorm';

export class instanceSettings1663689836425 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const settings = [
      {
        key: 'ALLOW_PERSONAL_WORKSPACE',
        value: 'true',
      },
    ];

    settings.map(async (setting) => {
      const { key, value } = setting;

      await entityManager.query(
        'insert into instance_settings ("key", "value", created_at, updated_at) values ($1, $2, $3, $3) returning *',
        [key, value, new Date()]
      );
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
