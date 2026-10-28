import {
  resolveEffectiveRevision,
  resolveLibraryComponentActions,
} from '@/AppBuilder/Widgets/libraryComponentRevision';
import { libraryFileUrl } from '@/_helpers/customComponentLibrariesStoreUtils';
import { builtinIdentity, isBuiltinLibrary } from '@/_helpers/builtinPacks';

// Built-in packs ship with ToolJet like native widgets: an instance names its pack, never a workspace library or a
// pinned version, and always runs the version the server ships.
const shadcn = builtinIdentity('shadcn');
const hashes = { shadcn: 'abc123def4567890' };

describe('built-in packs: identity, version and files', () => {
  it('names a built-in pack by pack, the same in every workspace', () => {
    // Break this catches: a built-in identity tied to a workspace library id, which breaks export/import.
    expect(shadcn).toEqual({ libraryId: 'builtin:shadcn', correlationId: 'builtin:shadcn' });
    expect(isBuiltinLibrary('builtin:shadcn')).toBe(true);
    expect(isBuiltinLibrary('0f6a3c2e-5b1d-4e8a-9c7b-1a2b3c4d5e6f')).toBe(false);
    expect(isBuiltinLibrary(undefined)).toBe(false);
  });

  it('always uses the version the server ships, ignoring any pin', () => {
    // Break this catches: a built-in instance stuck on a pinned version after an upgrade.
    const pins = { 'builtin:shadcn': 'v1.0.0' };
    expect(resolveEffectiveRevision(pins, shadcn.correlationId, hashes)).toBe('builtin:abc123def4567890');
  });

  it('has no version until the server has listed its packs, and none for a pack it does not ship', () => {
    // Break this catches: loading a built-in bundle under an undefined hash.
    expect(resolveEffectiveRevision({}, shadcn.correlationId, undefined)).toBeUndefined();
    expect(resolveEffectiveRevision({}, 'builtin:antd', hashes)).toBeUndefined();
  });

  it('keeps pinning for uploaded libraries', () => {
    // Break this catches: the built-in branch swallowing ordinary custom components.
    const correlationId = '0f6a3c2e-5b1d-4e8a-9c7b-1a2b3c4d5e6f';
    expect(resolveEffectiveRevision({ '0f6a3c2e5b1d4e8a9c7b1a2b3c4d5e6f': 'v3' }, correlationId, hashes)).toBe('v3');
  });

  it("loads a built-in pack's files from the built-in route under its hash", () => {
    // Break this catches: built-in files fetched from a workspace library route that has no such library.
    expect(libraryFileUrl('builtin:shadcn', 'builtin:abc123def4567890', 'index.js')).toMatch(
      /\/builtin-packs\/shadcn\/abc123def4567890\/index\.js$/
    );
    expect(libraryFileUrl('lib-1', 'v3', 'index.js')).toMatch(
      /\/custom-component-libraries\/lib-1\/revisions\/v3\/files\/index\.js$/
    );
  });

  it("resolves a built-in instance's actions from the shipped version's manifest", () => {
    // Break this catches: EventManager offering no actions for a built-in component.
    const componentDef = {
      component: {
        definition: {
          properties: {
            libraryId: { value: shadcn.libraryId },
            correlationId: { value: shadcn.correlationId },
            componentName: { value: 'Dialog' },
          },
        },
      },
    };
    const manifests = {
      'builtin:shadcn@builtin:abc123def4567890': { components: { Dialog: { actions: [{ name: 'open' }] } } },
    };
    expect(resolveLibraryComponentActions(componentDef, manifests, {}, hashes).map((a) => a.handle)).toEqual(['open']);
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
