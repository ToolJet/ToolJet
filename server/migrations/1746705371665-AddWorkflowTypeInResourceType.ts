import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowTypeInResourceType1746705371665 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
