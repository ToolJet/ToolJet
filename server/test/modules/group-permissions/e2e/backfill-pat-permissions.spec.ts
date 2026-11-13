import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  createUser,
  createGroupPermission,
  initTestApp,
  closeTestApp,
  getEntityRepository,
  findEntities,
} from 'test-helper';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Organization } from 'src/entities/organization.entity';
import { BackfillPatPermissionsOnDefaultGroups1791891636602 } from '../../../../data-migrations/1791891636602-BackfillPatPermissionsOnDefaultGroups';

/**
 * BackfillPatPermissionsOnDefaultGroups | data migration against the real schema.
 *
 * Existing workspaces get Create and Revoke on the Admin and Builder default groups; end-user and
 * custom groups keep the column default (false).
 */

/** @group platform */
describe('BackfillPatPermissionsOnDefaultGroups', () => {
  let nestApp: INestApplication;
  let organization: Organization;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
    ({ organization } = await createUser(nestApp, { email: 'admin@tooljet.io', groups: ['all_users', 'admin'] }));
    await createGroupPermission(nestApp, { organization, name: 'ops' });
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const runMigration = async () => {
    const { manager } = getEntityRepository(GroupPermissions);
    const queryRunner = { query: (sql: string, params?: unknown[]) => manager.query(sql, params) };
    await new BackfillPatPermissionsOnDefaultGroups1791891636602().up(queryRunner as unknown as QueryRunner);
  };

  const groupsByName = async () => {
    const groups = await findEntities(GroupPermissions, { where: { organizationId: organization.id } } as never);
    return Object.fromEntries(groups.map((group) => [group.name, group]));
  };

  // The state of an existing workspace before the migration runs: Admin has neither flag,
  // Builder has Create only, everything else is at the column default.
  beforeEach(async () => {
    const repo = getEntityRepository(GroupPermissions);
    const where = (name: string) => ({ organizationId: organization.id, name });
    await repo.update(where('admin'), { patCreate: false, patRevoke: false });
    await repo.update(where('builder'), { patCreate: true, patRevoke: false });
    await repo.update(where('end-user'), { patCreate: false, patRevoke: false });
    await repo.update(where('ops'), { patCreate: false, patRevoke: false });
  });

  it('should grant Create and Revoke to the admin and builder default groups', async () => {
    await runMigration();

    const groups = await groupsByName();
    expect(groups['admin']).toMatchObject({ patCreate: true, patRevoke: true });
    expect(groups['builder']).toMatchObject({ patCreate: true, patRevoke: true });
  });

  it('should leave the end-user default group and custom groups untouched', async () => {
    await runMigration();

    const groups = await groupsByName();
    expect(groups['end-user']).toMatchObject({ patCreate: false, patRevoke: false });
    expect(groups['ops']).toMatchObject({ patCreate: false, patRevoke: false });
  });

  it('should leave the groups unchanged when it runs a second time', async () => {
    await runMigration();
    await runMigration();

    const groups = await groupsByName();
    expect(groups['admin']).toMatchObject({ patCreate: true, patRevoke: true });
    expect(groups['builder']).toMatchObject({ patCreate: true, patRevoke: true });
    expect(groups['end-user']).toMatchObject({ patCreate: false, patRevoke: false });
  });
});
