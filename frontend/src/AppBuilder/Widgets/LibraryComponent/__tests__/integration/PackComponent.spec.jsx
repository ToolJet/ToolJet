import React from 'react';
import { act, waitFor } from '@testing-library/react';
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
import { loadLibraryModule, toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

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

// A field whose value starts from its Default value, with a hidden `value` prop (its own state, and the name an
// earlier release of it was set by), as the Rocket Number Input has.
const Counter = () => {
  const [defaultValue] = ToolJet.useStateNumber({ name: 'defaultValue', initialValue: 1 });
  const [value] = ToolJet.useStateNumber({ name: 'value', initialValue: defaultValue, inspector: 'hidden' });
  return <span data-testid="echo">{value === null ? 'empty' : String(value)}</span>;
};

// What types its text and number props reached it as.
const Kinds = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: '' });
  const [count] = ToolJet.useStateNumber({ name: 'count', initialValue: 0 });
  return <span data-testid="echo">{`${typeof label}:${label}/${typeof count}:${count}`}</span>;
};

// A pack component that reads a prop the host owns (Collapse when hidden), to see whether the host passes it on.
const Flag = () => {
  const [collapse] = ToolJet.useStateBoolean({ name: 'collapseWhenHidden', initialValue: false });
  return <span data-testid="echo">{String(collapse)}</span>;
};

// A pack component with a drop area (ToolJet.Slot), as a Tabs container or Card has.
const SlotCard = () => (
  <div>
    <ToolJet.Slot name="body" />
  </div>
);

const manifest = {
  manifestVersion: 2,
  components: {
    SlotCard: { displayName: 'Slot card', props: [], slots: [{ name: 'body', kind: 'slot' }] },
    Echo: { displayName: 'Echo', props: [{ name: 'label', type: 'string' }], actions: [{ name: 'ping' }] },
    Kinds: {
      displayName: 'Kinds',
      props: [
        { name: 'label', type: 'string', default: '' },
        { name: 'count', type: 'number', default: 0 },
      ],
    },
    Counter: {
      displayName: 'Counter',
      props: [
        { name: 'defaultValue', type: 'number', default: 1 },
        { name: 'value', type: 'number', default: 1, inspector: 'hidden' },
      ],
    },
    Flag: { displayName: 'Flag', props: [], actions: [] },
  },
};

const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'packcomponent1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Echo') },
  defaultStyles: { boxShadow: binding('0px 0px 0px 0px #00000040') },
  capabilities: {
    // A drop area is a ToolJet canvas, which is a drop target.
    dnd: true,
    network: [
      {
        url: `${API}/builtin-packs`,
        json: [{ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hash: HASH, hasCss: true }],
      },
      { url: `${API}/builtin-packs/shadcn/${HASH}/manifest.json`, json: manifest },
    ],
  },
});

function renderPack({ properties = {}, currentMode = 'edit', children = {} } = {}) {
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
  seedApp({ [ID]: definition, ...children }, { moduleId: MODULE_ID });
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
    loadLibraryModule.mockResolvedValue({ Echo, SlotCard, Counter, Kinds, Flag });
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

  // QA item 17: a drop saved every prop's sample, hidden ones too, so the saved hidden `value` 1 set the field on every
  // load and an emptied Default value never showed.
  test('[PackComponent-HIDDEN-001] starts from an emptied Default value over a hidden prop saved at its sample', async () => {
    // Break this catches: a hidden prop at its manifest sample reaching the component as set by the app.
    renderPack({
      properties: { componentName: binding('Counter'), defaultValue: binding('{{null}}'), value: binding('{{1}}') },
    });

    await waitFor(() => expect(shadowText()).toBe('empty'));
  });

  test('[PackComponent-HIDDEN-002] still takes a hidden prop an app set to something else', async () => {
    // Break this catches: every hidden prop being dropped, which loses a value an earlier release's app set by name.
    renderPack({
      properties: { componentName: binding('Counter'), defaultValue: binding('{{null}}'), value: binding('{{5}}') },
    });

    await waitFor(() => expect(shadowText()).toBe('5'));
  });

  // QA items 14-16: a pack property got whatever its binding resolved to, so a query row bound to a text property
  // crashed the widget or showed [object Object].
  test('[PackComponent-TYPES-001] hands each property the type its manifest declares', async () => {
    // Break this catches: the host passing a bound value through without its manifest type.
    renderPack({
      properties: { componentName: binding('Kinds'), label: binding('{{42}}'), count: binding('{{"1,200"}}') },
    });

    await waitFor(() => expect(shadowText()).toBe('string:42/number:1200'));
  });

  test('[PackComponent-TYPES-002] empties a value a property cannot take, and says why in the debugger', async () => {
    // Break this catches: an object reaching a text property (React cannot draw it), or the error going unreported.
    renderPack({ properties: { label: binding('{{ {id: 7} }}') } });

    await waitFor(() => expect(shadowText()).toBe('|'));
    await waitFor(() =>
      expect(store().debugger.logs).toContainEqual(
        expect.objectContaining({
          componentId: ID,
          message: 'Expected a value of type string, but received {"id":7}',
          errorTarget: 'Component Property',
        })
      )
    );
  });

  test('[PackComponent-HOSTKEY-001] keeps Collapse when hidden, which the host owns, out of the component props', async () => {
    // Break this catches: the host's collapseWhenHidden toggle reaching the pack component as its own prop.
    renderPack({ properties: { componentName: binding('Flag'), collapseWhenHidden: binding('{{true}}') } });

    await waitFor(() => expect(shadowText()).toBeDefined());
    await waitFor(() => expect(shadowText()).toBe('false'));
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

  test('[PackComponent-SLOT-002] a component dropped into its drop area can be selected again', async () => {
    // Break this catches: a drop area of a pack (or custom) component drawn as a read-only list-row mirror, so the
    // component in it gets no selection box and a click selects the pack component around it instead.
    const clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    const child = componentDefinition('child1', 'button1', 'Button', { text: binding('Inside') });
    child.component.parent = `${ID}-body`;
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    renderPack({ properties: { componentName: binding('SlotCard') }, children: { child1: child } });

    await waitFor(() => expect(document.querySelector('.ele-child1')).toBeTruthy());
    expect(document.querySelector('.ele-child1').classList).toContain('moveable-box');
    clientWidth.mockRestore();
  });
});
