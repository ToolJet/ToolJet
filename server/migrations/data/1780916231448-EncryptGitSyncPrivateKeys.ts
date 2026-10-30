import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EncryptionService } from '@modules/encryption/service';

export class EncryptGitSyncPrivateKeys1780916231448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const entityManager = queryRunner.manager;

    await dbTransactionWrap(async (manager: EntityManager) => {
      // ── HTTPS: github_private_key ────────────────────────────────────────
      const httpsRows: { id: string; github_private_key: string }[] = await manager.query(
        `SELECT id, github_private_key FROM organization_git_https WHERE github_private_key IS NOT NULL`
      );
      console.log(`[EncryptGitSyncPrivateKeys] Encrypting ${httpsRows.length} HTTPS private key(s)`);
      for (const row of httpsRows) {
        const encrypted = await encryptionService.encryptColumnValue(
          'organization_git_https',
          'github_private_key',
          row.github_private_key
        );
        await manager.query(`UPDATE organization_git_https SET github_private_key = $1 WHERE id = $2`, [
          encrypted,
          row.id,
        ]);
      }

      // ── SSH: ssh_private_key ─────────────────────────────────────────────
      const sshRows: { id: string; ssh_private_key: string }[] = await manager.query(
        `SELECT id, ssh_private_key FROM organization_git_ssh WHERE ssh_private_key IS NOT NULL`
      );
      console.log(`[EncryptGitSyncPrivateKeys] Encrypting ${sshRows.length} SSH private key(s)`);
      for (const row of sshRows) {
        const encrypted = await encryptionService.encryptColumnValue(
          'organization_git_ssh',
          'ssh_private_key',
          row.ssh_private_key
        );
        await manager.query(`UPDATE organization_git_ssh SET ssh_private_key = $1 WHERE id = $2`, [encrypted, row.id]);
      }

      // ── GitLab: gitlab_project_access_token ──────────────────────────────
      const gitlabRows: { id: string; gitlab_project_access_token: string }[] = await manager.query(
        `SELECT id, gitlab_project_access_token FROM organization_gitlab WHERE gitlab_project_access_token IS NOT NULL`
      );
      console.log(`[EncryptGitSyncPrivateKeys] Encrypting ${gitlabRows.length} GitLab access token(s)`);
      for (const row of gitlabRows) {
        const encrypted = await encryptionService.encryptColumnValue(
          'organization_gitlab',
          'gitlab_project_access_token',
          row.gitlab_project_access_token
        );
        await manager.query(`UPDATE organization_gitlab SET gitlab_project_access_token = $1 WHERE id = $2`, [
          encrypted,
          row.id,
        ]);
      }

      console.log('[EncryptGitSyncPrivateKeys] Migration complete');
    }, entityManager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const entityManager = queryRunner.manager;

    await dbTransactionWrap(async (manager: EntityManager) => {
      const httpsRows: { id: string; github_private_key: string }[] = await manager.query(
        `SELECT id, github_private_key FROM organization_git_https WHERE github_private_key IS NOT NULL`
      );
      for (const row of httpsRows) {
        const decrypted = await encryptionService.decryptColumnValue(
          'organization_git_https',
          'github_private_key',
          row.github_private_key
        );
        await manager.query(`UPDATE organization_git_https SET github_private_key = $1 WHERE id = $2`, [
          decrypted,
          row.id,
        ]);
      }

      const sshRows: { id: string; ssh_private_key: string }[] = await manager.query(
        `SELECT id, ssh_private_key FROM organization_git_ssh WHERE ssh_private_key IS NOT NULL`
      );
      for (const row of sshRows) {
        const decrypted = await encryptionService.decryptColumnValue(
          'organization_git_ssh',
          'ssh_private_key',
          row.ssh_private_key
        );
        await manager.query(`UPDATE organization_git_ssh SET ssh_private_key = $1 WHERE id = $2`, [decrypted, row.id]);
      }

      const gitlabRows: { id: string; gitlab_project_access_token: string }[] = await manager.query(
        `SELECT id, gitlab_project_access_token FROM organization_gitlab WHERE gitlab_project_access_token IS NOT NULL`
      );
      for (const row of gitlabRows) {
        const decrypted = await encryptionService.decryptColumnValue(
          'organization_gitlab',
          'gitlab_project_access_token',
          row.gitlab_project_access_token
        );
        await manager.query(`UPDATE organization_gitlab SET gitlab_project_access_token = $1 WHERE id = $2`, [
          decrypted,
          row.id,
        ]);
      }
    }, entityManager);
  }
}
