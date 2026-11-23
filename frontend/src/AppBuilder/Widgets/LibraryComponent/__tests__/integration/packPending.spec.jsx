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
import * as packsStore from '@/_stores/builtinPacksStore';
import { builtinPacksService } from '@/_services/builtinPacks.service';
import { loadLibraryModule, toolJetSdk as ToolJet } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

const { useBuiltinPacksStore } = packsStore;
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));
jest.setTimeout(20000);

const ID = 'pack1';
const HASH = 'abc123def4567890';
const API = 'http://localhost:3000/api';
const PACKS = [{ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hash: HASH, hasCss: true }];
const Echo = () => {
  const [label] = ToolJet.useStateString({ name: 'label', initialValue: '' });
  return <span data-testid="echo">{label}</span>;
};
const manifest = { manifestVersion: 2, components: { Echo: { displayName: 'Echo', props: [], actions: [] } } };
const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'packcomponent1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Echo') },
  capabilities: {
    network: [
      { url: `${API}/builtin-packs`, json: PACKS },
      { url: `${API}/builtin-packs/shadcn/${HASH}/manifest.json`, json: manifest },
    ],
  },
});
function renderPack({ mode = 'view', pack = 'shadcn' } = {}) {
  const definition = componentDefinition(ID, 'packcomponent1', 'PackComponent', {
    pack: binding(pack),
    componentName: binding('Echo'),
    label: binding('Hello'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
  });
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode(mode, MODULE_ID);
  return widget.session.render(
    <WidgetWrapper
      id={ID}
      moduleId={MODULE_ID}
      currentLayout="desktop"
      inCanvas
      mode={mode}
      darkMode={false}
      gridWidth={10}
      onOptionChange={() => {}}
      onOptionsChange={() => {}}
    />
  );
}
const box = () => document.querySelector('[data-cy="packcomponent1"]');
const shadowText = () => box()?.shadowRoot?.querySelector('[data-testid="echo"]')?.textContent;
const deferList = () => {
  const d = {};
  jest
    .spyOn(builtinPacksService, 'list')
    .mockImplementation(() => new Promise((res, rej) => Object.assign(d, { res, rej })));
  return d;
};

describe('PackComponent while its pack list loads', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'));
  beforeEach(async () => {
    await widget.setup();
    loadLibraryModule.mockResolvedValue({ Echo });
    act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: false } } }));
  });
  afterEach(() => {
    widget.teardown();
    jest.restoreAllMocks();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });

  test.each(['view', 'edit'])(
    '[PackComponent-PENDING-001] %s: a neutral box, not "Slot", until the list arrives',
    async (mode) => {
      const list = deferList();
      renderPack({ mode });
      await waitFor(() => expect(box()).toBeTruthy());
      expect(box()).toHaveAttribute('aria-busy', 'true');
      expect(box().textContent).toBe('');
      await act(async () => list.res(PACKS));
      await waitFor(() => expect(shadowText()).toBe('Hello'));
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    }
  );

  test('[PackComponent-PENDING-002] a pack this release does not ship still shows "Slot" once listed', async () => {
    const list = deferList();
    renderPack({ mode: 'edit', pack: 'retired' });
    await waitFor(() => expect(box()).toBeTruthy());
    expect(box().textContent).toBe('');
    await act(async () => list.res(PACKS));
    await waitFor(() => expect(box().textContent).toBe('Slot'));
    expect(box()).not.toHaveAttribute('aria-busy');
  });

  test('[PackComponent-PENDING-003] warm load: never busy, never "Slot"', async () => {
    useBuiltinPacksStore.setState({ packs: PACKS });
    renderPack();
    await waitFor(() => expect(box()).toBeTruthy());
    expect(box()).not.toHaveAttribute('aria-busy');
    expect(box().textContent).not.toBe('Slot');
    await waitFor(() => expect(shadowText()).toBe('Hello'));
  });

  test('[PackComponent-PENDING-004] setVisibility(false) hides the pending box', async () => {
    const list = deferList();
    renderPack();
    await waitFor(() => expect(box()).toBeTruthy());
    await widget.act('setVisibility', false);
    expect(box()).toHaveStyle({ display: 'none' });
    // Settle the module-level in-flight list, or the next test reuses it.
    await act(async () => list.res(PACKS));
  });
});

describe('prefetchPacksForPages', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });
  const pc = (pack) => ({
    component: { component: 'PackComponent', definition: { properties: { pack: { value: pack } } } },
  });
  test('[builtinPacks-PREFETCH-001] lists once and fetches each used pack manifest once', async () => {
    const list = jest.spyOn(builtinPacksService, 'list').mockResolvedValue(PACKS);
    const getManifest = jest.spyOn(builtinPacksService, 'getManifest').mockResolvedValue(manifest);
    packsStore.prefetchPacksForPages([
      { components: { a: pc('shadcn'), b: { component: { component: 'Button' } } } },
      { components: { c: pc('shadcn') } },
    ]);
    await waitFor(() => expect(useBuiltinPacksStore.getState().manifests.shadcn).toEqual(manifest));
    expect(list).toHaveBeenCalledTimes(1);
    expect(getManifest).toHaveBeenCalledTimes(1);
  });
  test('[builtinPacks-PREFETCH-002] an app without pack components asks for nothing', () => {
    const list = jest.spyOn(builtinPacksService, 'list').mockResolvedValue(PACKS);
    packsStore.prefetchPacksForPages([{ components: { b: { component: { component: 'Button' } } } }, {}]);
    packsStore.prefetchPacksForPages(undefined);
    expect(list).not.toHaveBeenCalled();
  });
});
