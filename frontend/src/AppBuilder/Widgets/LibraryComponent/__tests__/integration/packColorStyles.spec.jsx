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

// QA item 47: an Ant Button with Primary color set to "notacolor" lost its background and border (the browser drops a
// colour it can't read, so they went transparent) and its white label sat on the near-white canvas: the button was
// invisible. Rocket's colour styles did the same. A colour style the browser can't read now draws its default, and
// the debugger says why. The store, the widget wrapper, the inline SDK and the host are the real ones; only the
// bundle's module loading is replaced, and CSS.supports (the browser's colour check, which jsdom lacks) is stood in
// for with what a browser answers for the values used here.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ID = 'pack1';
const HASH = 'abc123def4567890';
const API = 'http://localhost:3000/api';
const DEFAULT_TINT = 'var(--cc-primary-brand)';

const Swatch = () => {
  const tint = ToolJet.useStyleString({ name: 'tint', label: 'Tint', inspector: 'color', initialValue: DEFAULT_TINT });
  const note = ToolJet.useStyleString({ name: 'note', label: 'Note', initialValue: '' });
  return <span data-testid="echo">{`${tint}|${note}`}</span>;
};

const manifest = {
  manifestVersion: 2,
  components: {
    Swatch: {
      displayName: 'Swatch',
      props: [],
      styles: [
        { name: 'tint', type: 'string', label: 'Tint', inspector: 'color', default: DEFAULT_TINT },
        { name: 'note', type: 'string', label: 'Note' },
      ],
    },
  },
};

const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'packcomponent1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Swatch') },
  defaultStyles: { boxShadow: binding('0px 0px 0px 0px #00000040') },
  capabilities: {
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

function renderPack(styles) {
  const definition = componentDefinition(ID, 'packcomponent1', 'PackComponent', {
    pack: binding('shadcn'),
    componentName: binding('Swatch'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
  });
  definition.component.definition.styles = { boxShadow: binding('0px 0px 0px 0px #00000040'), ...styles };
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  definition.layouts.mobile = { ...definition.layouts.desktop };
  seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode('edit', MODULE_ID);
  return widget.session.render(
    <WidgetWrapper
      id={ID}
      moduleId={MODULE_ID}
      currentLayout="desktop"
      inCanvas={true}
      mode="edit"
      darkMode={false}
      gridWidth={10}
      onOptionChange={() => {}}
      onOptionsChange={() => {}}
    />
  );
}

const shadowText = () =>
  document.querySelector('[data-cy="packcomponent1"]')?.shadowRoot?.querySelector('[data-testid="echo"]')?.textContent;
// What a browser's CSS.supports('color', ...) answers for the values these tests use.
const BROWSER_COLORS = new Set(['#e11d48', DEFAULT_TINT, 'oklch(0.6 0.2 25)']);
const colorErrors = () =>
  store().debugger.logs.filter((log) => log.componentId === ID && log.errorTarget === 'Component Style');

describe('PackComponent colour styles', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'));
  const realSupports = window.CSS.supports;
  beforeEach(async () => {
    await widget.setup();
    act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: false } } }));
    loadLibraryModule.mockResolvedValue({ Swatch });
    window.CSS.supports = (property, value) => property === 'color' && BROWSER_COLORS.has(value);
  });
  afterEach(() => {
    window.CSS.supports = realSupports;
    widget.teardown();
    loadLibraryModule.mockReset();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });

  test("[PackComponent-COLOR-001] a colour the browser can't read draws the style's default, and says why", async () => {
    // Break this catches: "notacolor" reaching the component, which the browser drops, leaving a transparent button.
    renderPack({ tint: binding('notacolor') });

    await waitFor(() => expect(shadowText()).toBe(`${DEFAULT_TINT}|`));
    await waitFor(() =>
      expect(colorErrors()).toEqual([
        expect.objectContaining({
          key: 'packcomponent1 - Tint',
          message: '"notacolor" is not a colour; the default colour is used',
          logLevel: 'error',
        }),
      ])
    );
  });

  test('[PackComponent-COLOR-002] a colour the browser reads reaches the component as it is', async () => {
    // Break this catches: a check that throws out real colours (a theme swatch, oklch) along with the bad ones.
    renderPack({ tint: binding('oklch(0.6 0.2 25)') });

    await waitFor(() => expect(shadowText()).toBe('oklch(0.6 0.2 25)|'));
    expect(colorErrors()).toEqual([]);
  });

  test('[PackComponent-COLOR-003] a style that is not a colour is never judged as one', async () => {
    // Break this catches: every text style run through the colour check, so plain text is thrown out.
    renderPack({ tint: binding('#e11d48'), note: binding('notacolor') });

    await waitFor(() => expect(shadowText()).toBe('#e11d48|notacolor'));
    expect(colorErrors()).toEqual([]);
  });

  test("[PackComponent-COLOR-004] where the browser can't check colours, the value is kept", async () => {
    // Break this catches: every colour thrown out where CSS.supports is missing (an old browser, a server render).
    window.CSS.supports = undefined;
    renderPack({ tint: binding('#e11d48') });

    await waitFor(() => expect(shadowText()).toBe('#e11d48|'));
  });
});
