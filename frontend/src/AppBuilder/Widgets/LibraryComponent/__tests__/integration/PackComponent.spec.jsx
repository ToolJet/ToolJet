import React from 'react';
import { act, waitFor } from '@testing-library/react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import {
  createWidgetHarness,
  binding,
  MODULE_ID,
  store,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { seedApp, componentDefinition } from '@/test/app-builder';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// PackComponent: a component from a pack that ships with ToolJet. It names only its pack and component, always draws
// the build this release serves (under its content hash), inline, and needs no custom-component licence.
// The store, the widget wrapper, the inline SDK and the host are the real ones; the network and the bundle's module
// loading are replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ID = 'pack1';
const HASH = 'abc123def4567890';
const API = 'http://localhost:3000/api';

// The pack's component, as the bundle exports it.
const Echo = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: '' });
  const [pack] = ToolJet.useStateString({ name: 'pack', initialValue: '' });
  ToolJet.useAction({ name: 'ping', displayName: 'Ping' }, () => 'pong');
  return (
    <span data-testid="echo">
      {label}|{pack}
    </span>
  );
};

const manifest = {
  manifestVersion: 2,
  components: {
    Echo: { displayName: 'Echo', props: [{ name: 'label', type: 'string' }], actions: [{ name: 'ping' }] },
  },
};

const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'packcomponent1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Echo') },
  defaultStyles: { boxShadow: binding('0px 0px 0px 0px #00000040') },
  capabilities: {
    network: [
      {
        url: `${API}/builtin-packs`,
        json: [{ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hash: HASH, hasCss: true }],
      },
      { url: `${API}/builtin-packs/shadcn/${HASH}/manifest.json`, json: manifest },
    ],
  },
});

function renderPack({ properties = {}, currentMode = 'edit' } = {}) {
  const definition = componentDefinition(ID, 'packcomponent1', 'PackComponent', {
    pack: binding('shadcn'),
    componentName: binding('Echo'),
    label: binding('Hello'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    ...properties,
  });
  definition.component.definition.styles = { boxShadow: binding('0px 0px 0px 0px #00000040') };
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  definition.layouts.mobile = { ...definition.layouts.desktop };
  seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode(currentMode, MODULE_ID);
  return widget.session.render(
    <WidgetWrapper
      id={ID}
      moduleId={MODULE_ID}
      currentLayout="desktop"
      inCanvas={true}
      mode={currentMode}
      darkMode={false}
      gridWidth={10}
      onOptionChange={() => {}}
      onOptionsChange={() => {}}
    />
  );
}

const shadowText = () =>
  document.querySelector('[data-cy="packcomponent1"]')?.shadowRoot?.querySelector('[data-testid="echo"]')?.textContent;

describe('PackComponent integration', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'));

  beforeEach(async () => {
    await widget.setup();
    loadLibraryModule.mockResolvedValue({ Echo });
    act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: false } } }));
  });
  afterEach(() => {
    widget.teardown();
    loadLibraryModule.mockReset();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });

  test("[PackComponent-RENDER-001] draws its pack's component inline from the build this release ships", async () => {
    // Break this catches: a pack component loading from a custom-component library route, a pinned version, or
    // any URL that isn't the shipped build's content hash.
    renderPack();

    await waitFor(() => expect(shadowText()).toBe('Hello|'));
    expect(loadLibraryModule).toHaveBeenCalledWith(
      `${API}/builtin-packs/shadcn/${HASH}/index.js`,
      expect.any(String),
      expect.anything()
    );
  });

  test('[PackComponent-RENDER-002] keeps which pack it draws out of the component props', async () => {
    // Break this catches: `pack` or `componentName` reaching the component as its own props.
    renderPack();

    await waitFor(() => expect(shadowText()).toBe('Hello|'));
  });

  test('[PackComponent-LICENCE-001] draws in a released app without a custom-component licence', async () => {
    // Break this catches: a pack component gated by the custom-component licence, which hides it on free plans.
    renderPack({ currentMode: 'view' });

    await waitFor(() => expect(shadowText()).toBe('Hello|'));
  });

  test("[PackComponent-SLOT-001] shows the placeholder for a pack this release doesn't ship", async () => {
    // Break this catches: loading a bundle under an undefined pack or hash.
    renderPack({ properties: { pack: binding('retired') } });

    await waitFor(() => expect(useBuiltinPacksStore.getState().packs).not.toBeNull());
    expect(document.querySelector('[data-cy="packcomponent1"]')?.textContent).toBe('Slot');
    expect(loadLibraryModule).not.toHaveBeenCalled();
  });

  test("[PackComponent-ACTION-001] exposes the manifest's actions as callable component actions", async () => {
    // Break this catches: a pack component's actions missing from its exposed variables (and the event manager).
    renderPack();

    await waitFor(() => expect(typeof store().getExposedValueOfComponent(ID, MODULE_ID)?.ping).toBe('function'));
    await waitFor(() => expect(shadowText()).toBe('Hello|'));
    await expect(store().getExposedValueOfComponent(ID, MODULE_ID).ping()).resolves.toBe('pong');
  });
});
