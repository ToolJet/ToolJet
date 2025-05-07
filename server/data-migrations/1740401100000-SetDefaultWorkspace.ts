import { MigrationInterface, QueryRunner } from 'typeorm';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getCustomEnvVars, getTooljetEdition } from '@helpers/utils.helper';

export class SetDefaultWorkspace1740401100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() !== TOOLJET_EDITIONS.EE) {
      console.log('Skipping migration as it is not EE edition');
      return;
    }

    // Check if default workspace URL is configured
    const defaultWorkspaceUrl = getCustomEnvVars('TOOLJET_DEFAULT_WORKSPACE_URL');
    if (defaultWorkspaceUrl) {
      try {
        const url = new URL(defaultWorkspaceUrl);
        const pathParts = url.pathname.split('/');
        const workspaceSlug = pathParts[pathParts.length - 1];
        if (workspaceSlug) {
          await queryRunner.query(`
            UPDATE organizations 
            SET is_default = true 
            WHERE slug = $1
          `, [workspaceSlug]);
          return;
        }
      } catch (err) {
        console.log('Invalid TOOLJET_DEFAULT_WORKSPACE_URL format');
      }
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
    if (getTooljetEdition() !== TOOLJET_EDITIONS.EE) {
      return;
    }

    // Unset all default workspaces
    await queryRunner.query(`
      UPDATE organizations 
      SET is_default = false;
    `);
  }
} 
