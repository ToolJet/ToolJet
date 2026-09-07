/** @jest-environment node */
const fs = require('fs');
const path = require('path');

// A component-specific action only works if BOTH halves exist:
//   1. an `actions[]` entry in the widget manifest, which is what populates the
//      builder's "Control component -> Action" dropdown (EventManager.jsx), and
//   2. an exposed value of the same name on the component, which is what
//      eventsSlice looks up by string key at fire time.
//
// Miss either and the failure is silent — an action that never appears in the UI,
// or a dropdown entry that resolves to undefined and does nothing. The manifest is
// also duplicated into the server, with no test anywhere enforcing that the two
// copies agree.
const repoRoot = path.resolve(__dirname, '../../../../../..');
const frontendManifest = path.join(repoRoot, 'frontend/src/AppBuilder/WidgetManager/widgets/tabs.js');
const serverManifest = path.join(repoRoot, 'server/src/modules/apps/services/widget-config/tabs.js');
const component = path.resolve(__dirname, '../Tabs.jsx');

const read = (file) => fs.readFileSync(file, 'utf8');

// Action handles sit two levels deep (6 spaces); the `handle` keys inside a
// `params` array sit two deeper still. Anchoring on the indentation keeps param
// handles like 'tabId' out of the list. Formatting is prettier-enforced here.
const declaredHandles = (source) => {
  const actionsBlock = source.slice(source.indexOf('actions: ['));
  return [...actionsBlock.matchAll(/^ {6}handle: '([^']+)'/gm)].map(([, handle]) => handle);
};

describe('Tabs component-specific actions', () => {
  const frontendHandles = declaredHandles(read(frontendManifest));
  const componentSource = read(component);

  it('declares the new next and previous actions', () => {
    expect(frontendHandles).toContain('setNextTab');
    expect(frontendHandles).toContain('setPreviousTab');
  });

  it('presents adjacent navigation immediately after Set current tab', () => {
    expect(frontendHandles.slice(0, 3)).toEqual(['setTab', 'setNextTab', 'setPreviousTab']);
    expect(componentSource).toContain('setNextTab: async function');
    expect(read(frontendManifest)).toMatch(/handle: 'setNextTab',\s+displayName: 'Go to next tab',\s+params: \[\]/);
    expect(read(frontendManifest)).toMatch(
      /handle: 'setPreviousTab',\s+displayName: 'Go to previous tab',\s+params: \[\]/
    );
  });

  it('exposes a function for every action the manifest declares', () => {
    // setVisibility/setDisable/setLoading come from the shared useExposeState
    // hook rather than from Tabs.jsx itself.
    const fromSharedHook = ['setVisibility', 'setDisable', 'setLoading'];

    const missing = frontendHandles
      .filter((handle) => !fromSharedHook.includes(handle))
      .filter((handle) => !new RegExp(`\\b${handle}\\s*:`).test(componentSource));

    expect(missing).toEqual([]);
  });

  it('keeps the server copy of the manifest in sync with the frontend', () => {
    expect(read(serverManifest)).toEqual(read(frontendManifest));
  });
});
