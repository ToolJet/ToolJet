import { MigrationInterface, QueryRunner } from 'typeorm';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { AppModule } from '@modules/app/module';
import { NestFactory } from '@nestjs/core';

export class SetDefaultWorkspace1740401100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is to load the env. Need to find a better way than initializing nest
    await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    if (process.env.TOOLJET_EDITION !== TOOLJET_EDITIONS.EE) {
      console.log('Skipping migration as it is not EE edition');
      return;
    }

    // Set the first created organization as default
    await queryRunner.query(`
      UPDATE organizations 
      SET is_default = true 
      WHERE id = (
        SELECT id 
        FROM organizations 
        ORDER BY created_at ASC 
        LIMIT 1
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
      return;
    }

    // Unset all default workspaces
    await queryRunner.query(`
      UPDATE organizations 
      SET is_default = false;
    `);
  }
} 
