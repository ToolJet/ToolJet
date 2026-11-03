import { packFileUrl } from '@/_helpers/builtinPacks';
import { isSdkComponentType } from '@/AppBuilder/_helpers/sdkComponentTypes';

describe('pack files', () => {
  it("serves a pack's files under the release's content hash", () => {
    // Break this catches: a pack loaded from a URL that doesn't change with its build, so an upgrade isn't picked up.
    const pack = { pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hash: 'abc123def4567890', hasCss: true };
    expect(packFileUrl(pack, 'index.js')).toMatch(/\/builtin-packs\/shadcn\/abc123def4567890\/index\.js$/);
    expect(packFileUrl(pack, 'manifest.json')).toMatch(/\/builtin-packs\/shadcn\/abc123def4567890\/manifest\.json$/);
  });
});

describe('SDK-built component types', () => {
  it('treats pack components and custom components alike for slots, rows and Form fields', () => {
    // Break this catches: a pack component missing from the canvas's slot, row or copy-paste handling.
    expect(isSdkComponentType('PackComponent')).toBe(true);
    expect(isSdkComponentType('LibraryComponent')).toBe(true);
    expect(isSdkComponentType('Button')).toBe(false);
    expect(isSdkComponentType(undefined)).toBe(false);
  });
});

describe('library runtime', () => {
  const { getLibraryComponentRuntime } = jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
  afterEach(() => window.localStorage.removeItem('tj-cc-runtime'));

  it('runs every library inline by default', () => {
    // Break this catches: a library falling back to the iframe while inline is the chosen default.
    expect(getLibraryComponentRuntime()).toBe('inline');
  });

  it('switches to the sandboxed iframe when the debug switch asks for it', () => {
    // Break this catches: losing the way back to the iframe runtime.
    window.localStorage.setItem('tj-cc-runtime', 'iframe');
    expect(getLibraryComponentRuntime()).toBe('iframe');
  });
});
