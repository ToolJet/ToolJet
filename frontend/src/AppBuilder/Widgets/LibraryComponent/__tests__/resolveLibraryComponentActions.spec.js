import {
  getLibraryComponentIdentity,
  resolveManifestActions,
  resolveLibraryComponentActions,
  mergeStaticAndDynamicActions,
} from '../../libraryComponentRevision';
import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';

const LIBRARY_ID = 'lib-1';
const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';
const DASHLESS = CORRELATION_ID.replace(/-/g, '');

const componentDef = (overrides = {}) => ({
  component: {
    component: 'LibraryComponent',
    definition: {
      properties: {
        libraryId: { value: LIBRARY_ID },
        correlationId: { value: CORRELATION_ID },
        componentName: { value: 'Widget' },
        ...overrides,
      },
    },
  },
});

describe('getLibraryComponentIdentity', () => {
  it('[LibraryComponent-IDENTITY-001] reads libraryId/correlationId/componentName off definition.properties', () => {
    expect(getLibraryComponentIdentity(componentDef())).toEqual({
      libraryId: LIBRARY_ID,
      correlationId: CORRELATION_ID,
      componentName: 'Widget',
    });
  });

  it('[LibraryComponent-IDENTITY-002] returns all-undefined for a non-LibraryComponent definition shape', () => {
    expect(getLibraryComponentIdentity({})).toEqual({
      libraryId: undefined,
      correlationId: undefined,
      componentName: undefined,
    });
  });
});

describe('resolveManifestActions', () => {
  it("[LibraryComponent-ACTIONS-001] normalizes a manifest action's `name` to `handle`, defaulting displayName to it", () => {
    // Break this catches: leaking the manifest's raw `name` key through instead of the
    // `handle` the action picker/param UI reads — EventManager's dropdown would break.
    const manifest = { components: { Widget: { actions: [{ name: 'reset' }] } } };
    expect(resolveManifestActions(manifest, 'Widget')).toEqual([{ handle: 'reset', displayName: 'reset', params: [] }]);
  });

  it('[LibraryComponent-ACTIONS-002] normalizes each param, keeping optional type/options only when present', () => {
    const manifest = {
      components: {
        Widget: {
          actions: [
            {
              name: 'setValue',
              displayName: 'Set Value',
              params: [{ handle: 'value', defaultValue: '', type: 'string' }, { handle: 'silent' }],
            },
          ],
        },
      },
    };
    expect(resolveManifestActions(manifest, 'Widget')).toEqual([
      {
        handle: 'setValue',
        displayName: 'Set Value',
        params: [
          { handle: 'value', displayName: 'value', defaultValue: '', type: 'string' },
          { handle: 'silent', displayName: 'silent', defaultValue: undefined },
        ],
      },
    ]);
  });

  it('[LibraryComponent-ACTIONS-004] labels switch options by displayName, leaving select options untouched', () => {
    // Break this catches: the Switch element renders option.displayName, so passing the
    // manifest's { name, value } through unchanged leaves every switch button blank.
    const options = [
      { name: 'On', value: 'on' },
      { name: 'Off', value: 'off' },
    ];
    const manifest = {
      components: {
        Widget: {
          actions: [
            {
              name: 'configure',
              params: [
                { handle: 'mode', type: 'switch', options },
                { handle: 'size', type: 'select', options },
              ],
            },
          ],
        },
      },
    };
    const [{ params }] = resolveManifestActions(manifest, 'Widget');
    expect(params[0].options).toEqual([
      { displayName: 'On', value: 'on' },
      { displayName: 'Off', value: 'off' },
    ]);
    expect(params[1].options).toEqual(options);
  });

  it('[LibraryComponent-ACTIONS-003] returns [] for a missing manifest, missing component, or no actions', () => {
    expect(resolveManifestActions(null, 'Widget')).toEqual([]);
    expect(resolveManifestActions({ components: {} }, 'Widget')).toEqual([]);
    expect(resolveManifestActions({ components: { Widget: {} } }, 'Widget')).toEqual([]);
  });
});

describe('resolveLibraryComponentActions', () => {
  // This is the function EventManager's action picker reads on every render — it must
  // stay a pure lookup into whatever `manifests` it's handed (no fetching of its own),
  // so that wiring `manifests` up to real Zustand state (as EventManager does) is what
  // makes the picker reactive to an in-flight fetch resolving elsewhere.
  const manifests = {
    [buildManifestCacheKey(LIBRARY_ID, 'v2')]: { components: { Widget: { actions: [{ name: 'reset' }] } } },
    [buildManifestCacheKey(LIBRARY_ID, 'dev:user-1')]: {
      components: { Widget: { actions: [{ name: 'devOnlyAction' }] } },
    },
  };

  it('[LibraryComponent-RESOLVE-001] returns [] when the manifest for the effective revision has not been fetched yet', () => {
    // Break this catches: EventManager crashing or returning stale data instead of an
    // empty list while a manifest fetch is still in flight (the pre-fetch/loading state).
    const pins = { [DASHLESS]: 'v3' }; // pinned to a revision not yet in `manifests`
    expect(resolveLibraryComponentActions(componentDef(), manifests, pins)).toEqual([]);
  });

  it("[LibraryComponent-RESOLVE-002] returns the pinned revision's actions once its manifest is in the cache", () => {
    // The regression this whole refactor targets: once the manifest for the pinned
    // revision lands in `manifests` (e.g. an async fetch resolving), this must reflect
    // it immediately — this is what EventManager subscribing to `manifests` fixes.
    const pins = { [DASHLESS]: 'v2' };
    expect(resolveLibraryComponentActions(componentDef(), manifests, pins)).toEqual([
      { handle: 'reset', displayName: 'reset', params: [] },
    ]);
  });

  it('[LibraryComponent-RESOLVE-003] looks up a dev-pinned library by (libraryId, revision) alone', () => {
    // Break this catches: reintroducing a devNonce param — freshness is the store's job now.
    const pins = { [DASHLESS]: 'dev:user-1' };
    expect(resolveLibraryComponentActions(componentDef(), manifests, pins)).toEqual([
      { handle: 'devOnlyAction', displayName: 'devOnlyAction', params: [] },
    ]);
  });

  it('[LibraryComponent-RESOLVE-004] returns [] when there is no pin for the library at all', () => {
    expect(resolveLibraryComponentActions(componentDef(), manifests, {})).toEqual([]);
  });
});

describe('mergeStaticAndDynamicActions', () => {
  // Break this catches: the bug this closes — EventManager returning only the manifest's
  // actions for a LibraryComponent, silently dropping static widget-config actions like
  // setVisibility from the "Control Component" action picker.
  it('[LibraryComponent-MERGEACTIONS-001] keeps static actions and appends dynamic ones after them', () => {
    const staticActions = [{ handle: 'setVisibility', displayName: 'Set visibility', params: [] }];
    const dynamicActions = [{ handle: 'reset', displayName: 'reset', params: [] }];
    expect(mergeStaticAndDynamicActions(staticActions, dynamicActions)).toEqual([...staticActions, ...dynamicActions]);
  });

  it('[LibraryComponent-MERGEACTIONS-002] returns just the static actions when there are no dynamic ones', () => {
    const staticActions = [{ handle: 'setVisibility', displayName: 'Set visibility', params: [] }];
    expect(mergeStaticAndDynamicActions(staticActions, [])).toEqual(staticActions);
  });
});
