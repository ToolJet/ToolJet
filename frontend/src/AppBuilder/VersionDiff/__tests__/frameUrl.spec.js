import { previewFrameUrl } from '../frameUrl';

describe('compare frame URL', () => {
  it('encodes spaces as %20, which the viewer reads back, never as +', () => {
    const url = previewFrameUrl({ app: 'sales', pageKey: 'home', version: 'Release 2', env: 'production' });
    expect(url).toBe('/applications/sales/home?version=Release%202&env=production');
    expect(url).not.toContain('+');
  });

  it('keeps a literal + in a name intact', () => {
    expect(previewFrameUrl({ app: 'a', pageKey: 'p', version: 'v1+hotfix' })).toContain('version=v1%2Bhotfix');
  });

  it('adds the subpath and the snapshot when there are ones', () => {
    expect(previewFrameUrl({ subpath: '/tooljet', app: 'a', pageKey: 'p', version: 'v1', snapshot: 's-1' })).toBe(
      '/tooljet/applications/a/p?version=v1&snapshot=s-1'
    );
  });
});
