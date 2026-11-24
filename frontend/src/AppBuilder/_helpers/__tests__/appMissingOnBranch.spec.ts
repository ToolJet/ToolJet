import { isAppMissingOnBranch, redirectAppMissingOnBranch } from '../appMissingOnBranch';

const editorLoad = {
  mode: 'edit',
  moduleMode: false,
  isPreviewForVersion: false,
};

describe('isAppMissingOnBranch', () => {
  it('is true when the editor load resolved no version on the branch', () => {
    expect(isAppMissingOnBranch({ editing_version: null }, editorLoad)).toBe(true);
  });

  it('is false when a version was resolved', () => {
    expect(isAppMissingOnBranch({ editing_version: { id: 'v1' } }, editorLoad)).toBe(false);
  });

  it.each([
    ['viewer', { mode: 'view' }],
    ['module', { moduleMode: true }],
    ['version preview', { isPreviewForVersion: true }],
  ])('is false for %s loads, which do not resolve a branch version', (_name, override) => {
    expect(isAppMissingOnBranch({ editing_version: null }, { ...editorLoad, ...override })).toBe(false);
  });
});

describe('redirectAppMissingOnBranch', () => {
  it('queues the dashboard toast and sends the user to the workspace dashboard', () => {
    const replace = jest.fn();
    redirectAppMissingOnBranch('ws-1', 'Orders', replace);
    expect(sessionStorage.getItem('git_sync_toast')).toBe('Orders does not exist on this branch');
    expect(replace).toHaveBeenCalledWith('/ws-1');
  });

  it('falls back to a generic name when the app has none', () => {
    redirectAppMissingOnBranch('ws-1', undefined, jest.fn());
    expect(sessionStorage.getItem('git_sync_toast')).toBe('This app does not exist on this branch');
  });
});
