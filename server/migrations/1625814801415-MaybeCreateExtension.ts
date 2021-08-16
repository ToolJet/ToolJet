import { MigrationInterface, QueryRunner } from "typeorm";

export class  MaybeCreateExtension1625814801415 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
   
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
