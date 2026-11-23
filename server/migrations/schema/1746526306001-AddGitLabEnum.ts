import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGitLabEnum1746526306001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "git_type" ADD VALUE 'gitlab';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
