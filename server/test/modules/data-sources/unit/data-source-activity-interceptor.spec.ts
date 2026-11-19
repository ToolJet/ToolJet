import { classifyDataSourceActivity } from '@modules/data-sources/dashboard/activity.interceptor';

const dataSource = { id: 'ds-1', organizationId: 'org-1' };
const user = { id: 'user-1', organizationId: 'org-1' };

describe('classifyDataSourceActivity', () => {
  it('should classify GET by environment as a view', () => {
    expect(
      classifyDataSourceActivity({
        method: 'GET',
        user,
        tj_data_source: dataSource,
        route: { path: '/api/data-sources/:id/environment/:environment_id' },
      })
    ).toEqual({ kind: 'view', userId: 'user-1', dataSourceId: 'ds-1', organizationId: 'org-1', branchId: null });
  });

  it('should classify a v1 update (rename included) as an edit', () => {
    expect(
      classifyDataSourceActivity({
        method: 'PUT',
        user,
        tj_data_source: dataSource,
        route: { path: '/api/data-sources/:id' },
        query: { branch_id: 'branch-1' },
      })
    ).toEqual({ kind: 'edit', userId: 'user-1', dataSourceId: 'ds-1', organizationId: 'org-1', branchId: 'branch-1' });
  });

  it('should classify a v2 update the same way, version-agnostically', () => {
    expect(
      classifyDataSourceActivity({
        method: 'PUT',
        user,
        tj_data_source: dataSource,
        route: { path: '/api/v2/data-sources/:id' },
      })
    ).toMatchObject({ kind: 'edit', dataSourceId: 'ds-1' });
  });

  it('should ignore create, delete, test connection and list', () => {
    for (const { method, path } of [
      { method: 'GET', path: '/api/data-sources/:organizationId' },
      { method: 'POST', path: '/api/data-sources' },
      { method: 'DELETE', path: '/api/data-sources/:id' },
      { method: 'POST', path: '/api/data-sources/:id/test-connection' },
    ]) {
      expect(classifyDataSourceActivity({ method, user, tj_data_source: dataSource, route: { path } })).toBeNull();
    }
  });

  it('should ignore an anonymous request or one with no resolved data source', () => {
    expect(
      classifyDataSourceActivity({
        method: 'PUT',
        tj_data_source: dataSource,
        route: { path: '/api/data-sources/:id' },
      })
    ).toBeNull();
    expect(
      classifyDataSourceActivity({
        method: 'GET',
        user,
        route: { path: '/api/data-sources/:id/environment/:environment_id' },
      })
    ).toBeNull();
  });
});
