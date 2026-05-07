import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { HttpException } from '@nestjs/common';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { USER_TYPE } from '@modules/users/constants/lifecycle';
import { USER_ROLE } from '@modules/group-permissions/constants';

export class SyncSuperAdminWorkspaceRoles1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition = getTooljetEdition() as TOOLJET_EDITIONS;
    if (edition !== TOOLJET_EDITIONS.EE) {
      console.log('[SyncSuperAdminWorkspaceRoles] Skipping: only runs on EE edition.');
      return;
    }

    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    try {
      const licenseInitService = nestApp.get<LicenseInitService>(LicenseInitService);
      await licenseInitService.initForMigration(manager);

      const { RolesService } = await import(`${await getImportPath(true, edition)}/roles/service`);
      const rolesService = nestApp.get(RolesService);

      // Pre-seed users already in editor set (admin/builder DEFAULT membership anywhere).
      // Their workspace bumps are seat-neutral — no editor seat consumed.
      const editorRows: Array<{ user_id: string }> = await manager.query(`
        SELECT DISTINCT u.id AS user_id
        FROM users u
        JOIN group_users gu       ON gu.user_id = u.id
        JOIN permission_groups pg ON pg.id = gu.group_id
        WHERE u.user_type = '${USER_TYPE.INSTANCE}'
          AND pg.type = 'default'
          AND pg.name IN ('${USER_ROLE.ADMIN}', '${USER_ROLE.BUILDER}')
      `);
      const usersInEditorSet = new Set<string>(editorRows.map((r) => r.user_id));

      // Candidates: super-admins whose DEFAULT membership is end-user or builder.
      // Ordered by user_id so all workspaces for a single user run consecutively.
      const candidates: Array<{ user_id: string; organization_id: string; from_role: string }> =
        await manager.query(`
          SELECT gu.user_id, pg.organization_id, pg.name AS from_role
          FROM users u
          JOIN group_users gu       ON gu.user_id = u.id
          JOIN permission_groups pg ON pg.id = gu.group_id
          WHERE u.user_type = '${USER_TYPE.INSTANCE}'
            AND pg.type = 'default'
            AND pg.name <> '${USER_ROLE.ADMIN}'
          ORDER BY gu.user_id
        `);

      const skipped: Array<{
        user_id: string;
        organization_id: string;
        from_role: string;
        status: number | string;
        reason: string;
      }> = [];
      let promotedCount = 0;
      let seatExhausted = false;

      for (const c of candidates) {
        // builder → admin and users already in the editor set are seat-neutral.
        const isSeatNeutral = c.from_role === USER_ROLE.BUILDER || usersInEditorSet.has(c.user_id);

        if (seatExhausted && !isSeatNeutral) {
          skipped.push({
            user_id: c.user_id,
            organization_id: c.organization_id,
            from_role: c.from_role,
            status: 'short_circuited',
            reason: 'Editor seat limit already reached on this run; not attempted',
          });
          continue;
        }

        try {
          await rolesService.updateUserRole(c.organization_id, {
            userId: c.user_id,
            newRole: USER_ROLE.ADMIN,
          });
          promotedCount += 1;
          usersInEditorSet.add(c.user_id);
        } catch (err) {
          const status = err instanceof HttpException ? err.getStatus() : (err?.status ?? 'unknown');
          const response = err instanceof HttpException ? err.getResponse() : null;
          const reason = response
            ? typeof response === 'string'
              ? response
              : JSON.stringify(response)
            : err?.message ?? 'unknown error';

          skipped.push({ user_id: c.user_id, organization_id: c.organization_id, from_role: c.from_role, status, reason });

          if (status === 451) seatExhausted = true;
        }
      }

      console.log(
        `[SyncSuperAdminWorkspaceRoles] promoted=${promotedCount} skipped=${skipped.length} candidates=${candidates.length} seat_exhausted=${seatExhausted}`
      );
      if (skipped.length > 0) {
        console.log(
          '[SyncSuperAdminWorkspaceRoles] Skipped pairs (manual follow-up required):\n' +
            skipped
              .map(
                (s) =>
                  `  user_id=${s.user_id} organization_id=${s.organization_id} from_role=${s.from_role} status=${s.status} reason=${s.reason}`
              )
              .join('\n')
        );
      }
    } finally {
      await nestApp.close();
    }
  }

  public async down(): Promise<void> {
    // No-op: previous role membership cannot be reliably reconstructed.
  }
}
