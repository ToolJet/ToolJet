import { isAppMissingOnBranch, redirectAppMissingOnBranch } from '../appMissingOnBranch';

const editorLoad = { mode: 'edit', moduleMode: false, isPreviewForVersion: false };

describe('isAppMissingOnBranch', () => {
  it('is true when the server flags the editing version as unresolved', () => {
    expect(isAppMissingOnBranch({ editing_version_unresolved: true }, editorLoad)).toBe(true);
  });

  it('is false when a version was resolved', () => {
    expect(isAppMissingOnBranch({ editing_version: { id: 'v1' } }, editorLoad)).toBe(false);
  });

  it('is false when the server did not flag the response, even without a version', () => {
    expect(isAppMissingOnBranch({ editing_version: null }, editorLoad)).toBe(false);
  });

  it.each([
    ['viewer', { mode: 'view' }],
    ['module', { moduleMode: true }],
    ['version preview', { isPreviewForVersion: true }],
  ])('is false for %s loads', (_name, override) => {
    expect(isAppMissingOnBranch({ editing_version_unresolved: true }, { ...editorLoad, ...override })).toBe(false);
  });
});

describe('redirectAppMissingOnBranch', () => {
  beforeEach(() => sessionStorage.clear());

  it('queues the dashboard toast and goes to the workspace dashboard', () => {
    const replace = jest.fn();
    redirectAppMissingOnBranch('ws-1', { name: 'Orders' }, replace);
    expect(sessionStorage.getItem('git_sync_toast')).toBe('Orders does not exist on this branch');
    expect(replace).toHaveBeenCalledWith('/ws-1');
  });

  it('uses a generic name when the app has none', () => {
    redirectAppMissingOnBranch('ws-1', {}, jest.fn());
    expect(sessionStorage.getItem('git_sync_toast')).toBe('This app does not exist on this branch');
  });

  it('reports the git error when hydration failed, not "does not exist"', () => {
    redirectAppMissingOnBranch(
      'ws-1',
      { name: 'Orders', hydration_status: 'failed', hydration_error: { code: 'X', message: 'repo unreachable' } },
      jest.fn()
    );
    expect(sessionStorage.getItem('git_sync_toast')).toBe("Couldn't load Orders from git: repo unreachable");
  });
});
