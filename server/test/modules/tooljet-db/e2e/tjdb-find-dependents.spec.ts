/**
 * `InternalTableRepository.findDependents` is the single check behind both the drop-table blocker and
 * the `/dependents` warning. It must see a table referenced from any non-stub version of any app type -
 * a never-released draft included - because `apps.current_version_id` only points at a *released* version.
 * SQL-mode queries name the table instead of holding its id, so they are matched by name.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  saveEntity,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRepository } from '@modules/tooljet-db/repository';

describe('InternalTableRepository.findDependents', () => {
  let app: INestApplication;
  let repository: InternalTableRepository;
  let orgId: string;
  let admin: Awaited<ReturnType<typeof createUser>>['user'];
  let tooljetDbSourceId: string;

  async function createAppWithQuery(
    name: string,
    type: 'front-end' | 'workflow' | 'module',
    options: Record<string, unknown>
  ): Promise<{ app: App; version: AppVersion }> {
    const created = await createApplication(app, { name, user: admin, type });
    const version = await createApplicationVersion(app, created as App & { organizationId: string });
    await saveEntity(DataQuery, {
      name: 'tjdbQuery',
      options,
      dataSourceId: tooljetDbSourceId,
      appVersionId: version.id,
    } as Partial<DataQuery>);
    return { app: created, version };
  }

  beforeAll(async () => {
    ({ app } = await initTestApp());
    repository = app.get(InternalTableRepository, { strict: false });

    const { user } = await createUser(app, {
      email: 'find-dependents-admin@tooljet.io',
      groups: ['admin', 'end-user'],
    });
    admin = user;
    orgId = user.defaultOrganizationId;

    const tooljetDbSource = await saveEntity(DataSourceEntity, {
      name: 'tooljetdb',
      kind: 'tooljetdb',
      type: 'static',
      scope: 'global',
      organizationId: orgId,
    } as Partial<DataSourceEntity>);
    tooljetDbSourceId = tooljetDbSource.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  it.each(['front-end', 'workflow', 'module'] as const)(
    'should find a %s whose only version is an unreleased draft',
    async (type) => {
      const tableId = uuidv4();
      const { app: dependent } = await createAppWithQuery(`draft-${type}`, type, {
        table_id: tableId,
        operation: 'list_rows',
      });

      const { count, dependents } = await repository.findDependents(tableId, orgId);

      expect(count).toBe(1);
      expect(dependents).toMatchObject([{ id: dependent.id, type, queries: [{ name: 'tjdbQuery' }] }]);
    }
  );

  it('should find a reference that only an older, superseded version holds', async () => {
    const tableId = uuidv4();
    const { app: dependent, version: oldVersion } = await createAppWithQuery('superseded-version', 'front-end', {
      table_id: tableId,
      operation: 'list_rows',
    });
    const newerVersion = await createApplicationVersion(app, dependent as App & { organizationId: string });
    await updateEntity(App, dependent.id, { currentVersionId: newerVersion.id });

    const { count } = await repository.findDependents(tableId, orgId);

    expect(oldVersion.id).not.toBe(newerVersion.id);
    expect(count).toBe(1);
  });

  it('should find a table used only as the primary table of a join', async () => {
    const tableId = uuidv4();
    await createAppWithQuery('join-primary-table', 'front-end', {
      operation: 'join_tables',
      join_table: { from: { name: tableId }, joins: [] },
    });

    const { count } = await repository.findDependents(tableId, orgId);

    expect(count).toBe(1);
  });

  describe('SQL-mode queries', () => {
    async function createTable(tableName: string): Promise<string> {
      const table = await saveEntity(InternalTable, {
        organizationId: orgId,
        tableName,
        co_relation_id: uuidv4(),
      } as Partial<InternalTable>);
      return table.id;
    }

    it.each(['front-end', 'workflow', 'module'] as const)(
      'should find a %s whose draft names the table in raw SQL',
      async (type) => {
        const tableName = `sql_orders_${type.replace('-', '_')}`;
        const tableId = await createTable(tableName);
        const { app: dependent } = await createAppWithQuery(`sql-${type}`, type, {
          operation: 'sql_execution',
          sql_execution: { sqlQuery: `SELECT * FROM ${tableName} WHERE id = {{components.input1.value}}` },
        });

        const { count, dependents } = await repository.findDependents(tableId, orgId);

        expect(count).toBe(1);
        expect(dependents).toMatchObject([{ id: dependent.id, type }]);
      }
    );

    it('should not find a SQL query that only names a longer table containing the name', async () => {
      const tableId = await createTable('sql_short');
      await createAppWithQuery('sql-longer-name', 'front-end', {
        operation: 'sql_execution',
        sql_execution: { sqlQuery: 'SELECT * FROM sql_short_archive' },
      });

      const { count } = await repository.findDependents(tableId, orgId);

      expect(count).toBe(0);
    });
  });

  it('should not find a stub version', async () => {
    const tableId = uuidv4();
    const { version } = await createAppWithQuery('stub-version', 'front-end', {
      table_id: tableId,
      operation: 'list_rows',
    });
    await updateEntity(AppVersion, version.id, { isStub: true });

    const { count } = await repository.findDependents(tableId, orgId);

    expect(count).toBe(0);
  });

  it('should report no dependents for an unreferenced table', async () => {
    const { count, dependents } = await repository.findDependents(uuidv4(), orgId);

    expect(count).toBe(0);
    expect(dependents).toEqual([]);
  });
});
