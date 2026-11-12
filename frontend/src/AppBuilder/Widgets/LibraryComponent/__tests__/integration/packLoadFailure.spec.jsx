import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
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
import InlineLibraryComponent, {
  LOAD_RETRY_DELAYS_MS,
} from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';

// QA item 19: when a pack's code failed to load (a dropped connection, a server error), the component showed the raw
// error ("failed to fetch bundle (503)") in place of itself, the components inside it were gone from the canvas, and
// it never tried again: only a page reload brought it back. Now it tries again on its own (twice, a few seconds
// apart, and when the browser comes back online), then says it couldn't load and offers Retry; the components
// inside it stay on the canvas meanwhile. The store, the widget wrapper, the inline SDK and the host are the real
// ones; only the bundle's module loading is replaced, failing as the network would.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ID = 'pack1';
const HASH = 'abc123def4567890';
const API = 'http://localhost:3000/api';

const Echo = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: '' });
  return <span data-testid="echo">{label}</span>;
};
const SlotCard = () => (
  <div data-testid="echo">
    <ToolJet.Slot name="body" />
  </div>
);
const bundle = { Echo, SlotCard };

const manifest = {
  manifestVersion: 2,
  components: {
    Echo: { displayName: 'Echo', props: [{ name: 'label', type: 'string' }] },
    SlotCard: { displayName: 'Slot card', props: [], slots: [{ name: 'body', kind: 'slot' }] },
  },
};

const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'packcomponent1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Echo') },
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

function renderPack({ properties = {}, children = {} } = {}) {
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

const shadow = () => document.querySelector('[data-cy="packcomponent1"]')?.shadowRoot;
const shadowText = () => shadow()?.querySelector('[data-testid="echo"]')?.textContent;
const failure = () => shadow()?.querySelector('[data-tj-load-error]');
const retryButton = () => [...(failure()?.querySelectorAll('button') ?? [])].find((b) => b.textContent === 'Retry');
// The automatic tries run after short delays here (real timers: fake ones raced the store's own async work), so a
// wait of a second covers both of them.
const SHORT_DELAYS = [20, 40];
const LONG = { timeout: 1500 };
const failedToFetch = () => Promise.reject(new Error('failed to fetch bundle (503)'));

describe('PackComponent whose code fails to load', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'));
  const realDelays = [...LOAD_RETRY_DELAYS_MS];
  beforeAll(() => LOAD_RETRY_DELAYS_MS.splice(0, Infinity, ...SHORT_DELAYS));
  afterAll(() => LOAD_RETRY_DELAYS_MS.splice(0, Infinity, ...realDelays));

  let consoleError;
  beforeEach(async () => {
    await widget.setup();
    act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: false } } }));
    // The failure is still logged for developers; kept out of the test output.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    widget.teardown();
    loadLibraryModule.mockReset();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });

  test('[PackComponent-LOADFAIL-001] tries again on its own and draws once the code loads', async () => {
    // Break this catches: one failed load leaving the component broken until the page is reloaded.
    loadLibraryModule.mockImplementationOnce(failedToFetch).mockResolvedValue(bundle);
    renderPack();

    await waitFor(() => expect(shadowText()).toBe('Hello'), LONG);
    expect(failure()).toBeFalsy();
  });

  test('[PackComponent-LOADFAIL-002] after its tries fail, says it could not load and offers Retry, not the raw error', async () => {
    // Break this catches: the raw loader error ("failed to fetch bundle (503)") drawn in place of the component.
    loadLibraryModule.mockImplementation(failedToFetch);
    renderPack();

    await waitFor(() => expect(failure()).toBeTruthy(), LONG);
    expect(loadLibraryModule).toHaveBeenCalledTimes(3);
    expect(failure().textContent).toContain("This component couldn't load.");
    expect(failure().textContent).not.toContain('failed to fetch bundle');
    expect(retryButton()).toBeTruthy();
  });

  test('[PackComponent-LOADFAIL-003] Retry loads it again and draws it', async () => {
    // Break this catches: a Retry that reuses the failed load, or none at all.
    loadLibraryModule.mockImplementation(failedToFetch);
    renderPack();
    await waitFor(() => expect(retryButton()).toBeTruthy(), LONG);

    loadLibraryModule.mockResolvedValue(bundle);
    fireEvent.click(retryButton());

    await waitFor(() => expect(shadowText()).toBe('Hello'), LONG);
    expect(failure()).toBeFalsy();
  });

  test('[PackComponent-LOADFAIL-004] loads again when the browser comes back online', async () => {
    // Break this catches: a component that failed while offline staying broken after the connection returns.
    loadLibraryModule.mockImplementation(failedToFetch);
    renderPack();
    await waitFor(() => expect(failure()).toBeTruthy(), LONG);

    loadLibraryModule.mockResolvedValue(bundle);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(shadowText()).toBe('Hello'), LONG);
  });

  test('[PackComponent-LOADFAIL-005] keeps the components inside it on the canvas', async () => {
    // Break this catches: a container whose code failed to load hiding the components dropped into it.
    const clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    const child = componentDefinition('child1', 'button1', 'Button', { text: binding('Inside') });
    child.component.parent = `${ID}-body`;
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    loadLibraryModule.mockImplementation(failedToFetch);
    renderPack({ properties: { componentName: binding('SlotCard') }, children: { child1: child } });

    await waitFor(() => expect(failure()).toBeTruthy(), LONG);
    await waitFor(() => expect(document.querySelector('.ele-child1')).toBeTruthy(), LONG);
    // Projected into the failure box, so it draws there and not hidden behind the component.
    expect(failure().querySelector('slot')).toBeTruthy();
    clientWidth.mockRestore();
  });
});

// Seen in the browser: with a pack's code down, every component from it showed the note, and a Retry that loaded the
// code drew only the component it was pressed on; the rest stayed broken until each was retried.
describe('components from one pack whose code failed to load', () => {
  const realDelays = [...LOAD_RETRY_DELAYS_MS];
  beforeAll(() => LOAD_RETRY_DELAYS_MS.splice(0, Infinity, ...SHORT_DELAYS));
  afterAll(() => LOAD_RETRY_DELAYS_MS.splice(0, Infinity, ...realDelays));
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    loadLibraryModule.mockReset();
  });

  const mount = (cy) => (
    <InlineLibraryComponent
      key={cy}
      bundleUrl="shared.js"
      cssUrl="shared.css"
      cacheKey="shared-pack"
      componentName="Echo"
      componentProps={{ label: cy }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      dataCy={cy}
    />
  );
  const rootOf = (cy) => document.querySelector(`[data-cy="${cy}"]`)?.shadowRoot;

  test('[PackComponent-LOADFAIL-006] a Retry that loads the code draws every component from it', async () => {
    // Break this catches: the components a Retry was not pressed on staying broken once the code has loaded.
    loadLibraryModule.mockImplementation(failedToFetch);
    const view = render(
      <>
        {mount('first')}
        {mount('second')}
      </>
    );
    await waitFor(() => {
      expect(rootOf('first')?.querySelector('[data-tj-load-error]')).toBeTruthy();
      expect(rootOf('second')?.querySelector('[data-tj-load-error]')).toBeTruthy();
    }, LONG);

    loadLibraryModule.mockResolvedValue(bundle);
    fireEvent.click(rootOf('first').querySelector('[data-tj-load-error] button'));

    await waitFor(() => {
      expect(rootOf('first')?.querySelector('[data-testid="echo"]')?.textContent).toBe('first');
      expect(rootOf('second')?.querySelector('[data-testid="echo"]')?.textContent).toBe('second');
    }, LONG);
    view.unmount();
  });
});
