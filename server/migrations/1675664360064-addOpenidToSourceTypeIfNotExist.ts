import { MigrationInterface, QueryRunner } from 'typeorm';

// This migration is for users migrating from CE -> EE
export class addOpenidToSourceTypeIfNotExist1675664360064 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sources = await queryRunner.query('select enum_range(null::source)');

    // Validating of openid exist in the source enum type
    if (!sources?.[0]?.enum_range?.includes('openid')) {
      await queryRunner.query("ALTER TYPE source ADD VALUE 'openid'");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
