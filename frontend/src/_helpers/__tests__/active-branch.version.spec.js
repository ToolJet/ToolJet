import { getVersionNameFromUrl, setVersionInUrl } from '../active-branch';

const setUrl = (path) => window.history.pushState({}, '', path);

describe('getVersionNameFromUrl', () => {
  afterEach(() => setUrl('/'));

  it('reads the version name from ?version=', () => {
    setUrl('/my-workspace/apps/app-slug?version=v2');
    expect(getVersionNameFromUrl()).toBe('v2');
  });

  it('returns null when absent', () => {
    setUrl('/my-workspace/apps/app-slug');
    expect(getVersionNameFromUrl()).toBeNull();
  });
});

describe('setVersionInUrl', () => {
  afterEach(() => setUrl('/'));

  it('stamps ?version=<name> on an editor URL with none yet', () => {
    setUrl('/my-workspace/apps/app-slug');
    setVersionInUrl('v2');
    expect(getVersionNameFromUrl()).toBe('v2');
  });

  it('stamps ?version=<name> on a viewer (/applications/:slug) URL', () => {
    setUrl('/applications/app-slug');
    setVersionInUrl('v2');
    expect(getVersionNameFromUrl()).toBe('v2');
  });

  it('overwrites a stale version name with the resolved one', () => {
    setUrl('/my-workspace/apps/app-slug?version=old');
    setVersionInUrl('new');
    expect(getVersionNameFromUrl()).toBe('new');
  });

  it('does not add a history entry (uses replaceState)', () => {
    setUrl('/my-workspace/apps/app-slug');
    const lengthBefore = window.history.length;
    setVersionInUrl('v2');
    expect(window.history).toHaveLength(lengthBefore);
  });

  it('is a no-op on a version-irrelevant path (e.g. workspace settings)', () => {
    setUrl('/my-workspace/settings');
    setVersionInUrl('v2');
    expect(getVersionNameFromUrl()).toBeNull();
  });

  it('clears the param when called with a falsy name', () => {
    setUrl('/my-workspace/apps/app-slug?version=v2');
    setVersionInUrl(null);
    expect(getVersionNameFromUrl()).toBeNull();
  });
});
