import { classifyActivity } from '@modules/apps/dashboard/activity.interceptor';

const app = { id: 'app-1', currentVersionId: 'rel-1' };
const user = { id: 'user-1', branchId: 'branch-user' };

describe('classifyActivity', () => {
  it('should classify a mutating request with :versionId as an edit of that version', () => {
    expect(
      classifyActivity({
        method: 'PUT',
        params: { versionId: 'v-1' },
        user,
        tj_app: app,
        route: { path: '/api/v2/apps/:id/versions/:versionId/components' },
      })
    ).toEqual({ kind: 'edit', userId: 'user-1', appId: 'app-1', versionId: 'v-1' });
  });

  it('should count promote as an edit', () => {
    expect(
      classifyActivity({
        method: 'PUT',
        params: { versionId: 'v-1' },
        user,
        tj_app: app,
        route: { path: '/api/v2/apps/:id/versions/:versionId/promote' },
      })
    ).toMatchObject({ kind: 'edit', versionId: 'v-1' });
  });

  it('should not count running or previewing a query, or a git push, as an edit', () => {
    for (const path of [
      '/api/data-queries/:id/versions/:versionId/run/:environmentId',
      '/api/data-queries/:id/versions/:versionId/preview/:environmentId',
      '/api/app-git/gitpush/:appId/:versionId',
    ]) {
      expect(
        classifyActivity({ method: 'POST', params: { versionId: 'v-1' }, user, tj_app: app, route: { path } })
      ).toBeNull();
    }
  });

  it('should classify app rename / icon / public as an app edit on the request branch, else the user branch', () => {
    expect(
      classifyActivity({
        method: 'PUT',
        params: { id: 'app-1' },
        user,
        tj_app: app,
        route: { path: '/api/apps/:id' },
        body: { app: { branch_id: 'branch-body' } },
      })
    ).toEqual({ kind: 'app_edit', userId: 'user-1', appId: 'app-1', branchId: 'branch-body' });
    expect(
      classifyActivity({
        method: 'PUT',
        params: { id: 'app-1' },
        user,
        tj_app: app,
        route: { path: '/api/apps/:id/icons' },
      })
    ).toEqual({
      kind: 'app_edit',
      userId: 'user-1',
      appId: 'app-1',
      branchId: 'branch-user',
    });
    expect(
      classifyActivity({
        method: 'PUT',
        params: { id: 'app-1' },
        user: { id: 'user-1' },
        tj_app: app,
        route: { path: '/api/apps/:id/public' },
      })
    ).toEqual({
      kind: 'app_edit',
      userId: 'user-1',
      appId: 'app-1',
      branchId: null,
    });
  });

  it('should classify GET apps/slugs/:slug of a released app as a view of the released version', () => {
    expect(
      classifyActivity({ method: 'GET', params: {}, user, tj_app: app, route: { path: '/api/apps/slugs/:slug' } })
    ).toEqual({
      kind: 'view',
      userId: 'user-1',
      appId: 'app-1',
      versionId: 'rel-1',
    });
  });

  it('should ignore anonymous requests, GETs on edit routes, unreleased slug opens and app delete', () => {
    expect(classifyActivity({ method: 'PUT', params: { versionId: 'v-1' }, tj_app: app })).toBeNull();
    expect(
      classifyActivity({
        method: 'GET',
        params: { versionId: 'v-1' },
        user,
        tj_app: app,
        route: { path: '/api/v2/apps/:id/versions/:versionId' },
      })
    ).toBeNull();
    expect(
      classifyActivity({
        method: 'GET',
        params: {},
        user,
        tj_app: { id: 'app-1', currentVersionId: null },
        route: { path: '/api/apps/slugs/:slug' },
      })
    ).toBeNull();
    expect(classifyActivity({ method: 'POST', params: { versionId: 'v-1' }, user })).toBeNull();
    expect(
      classifyActivity({
        method: 'DELETE',
        params: { id: 'app-1' },
        user,
        tj_app: app,
        route: { path: '/api/apps/:id' },
      })
    ).toBeNull();
  });
});
