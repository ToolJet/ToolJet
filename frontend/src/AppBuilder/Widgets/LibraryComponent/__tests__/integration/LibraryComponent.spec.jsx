import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  drain,
  MODULE_ID,
  store,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { seedApp, componentDefinition } from '@/test/app-builder';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';

const ID = 'lib1';
const SIBLING_ID = 'lib2';
const LIBRARY_ID = 'lib-1';
const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';
const PIN_KEY = dashlessId(CORRELATION_ID);

// Effective revision now comes ONLY from the library-level pin
// (globalSettings.customComponentLibraries) — there is no per-instance fallback
// (see useEffectiveLibraryRevision). Every scenario below that expects a
// configured/iframe render sets this pin explicitly instead of a `revisionId`
// property on the instance.
const setPin = (value) =>
  act(() => store().setGlobalSettings({ customComponentLibraries: value ? { [PIN_KEY]: value } : {} }));

const setLicenseAccess = (hasAccess) =>
  act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: hasAccess } } }));

const manifest = {
  components: {
    Widget: {
      displayName: 'Widget',
      props: [],
      events: [],
      actions: [{ name: 'reset', displayName: 'Reset' }],
    },
    OtherWidget: {
      displayName: 'Other widget',
      props: [],
      events: [],
      actions: [{ name: 'refresh', displayName: 'Refresh' }],
    },
  },
};

const identityProperties = {
  libraryId: binding(LIBRARY_ID),
  correlationId: binding(CORRELATION_ID),
  libraryName: binding('My UI Library'),
  componentName: binding('Widget'),
  visibility: binding('{{true}}'),
  loadingState: binding('{{false}}'),
};

const widget = createWidgetHarness({
  componentType: 'LibraryComponent',
  handle: 'librarycomponent1',
  id: ID,
  defaultProperties: identityProperties,
  defaultStyles: {
    boxShadow: binding('0px 0px 0px 0px #00000040'),
  },
  capabilities: {
    network: [
      {
        url: 'http://localhost:3000/api/custom-component-libraries/missing-lib/revisions/v1/files/manifest.json',
        status: 404,
        json: {},
      },
      {
        url: 'http://localhost:3000/api/custom-component-libraries/bad-lib/revisions/v1/files/manifest.json',
        body: '{ this is not json',
      },
      {
        url: 'http://localhost:3000/api/custom-component-libraries/:libraryId/revisions/:revision/files/manifest.json',
        json: manifest,
      },
    ],
  },
});

const getIframe = (handle = 'librarycomponent1') => document.querySelector(`iframe[data-cy="${handle}"]`);
const getWrapperEl = () => document.querySelector(`.ele-${ID}`);
const getLoader = () => document.querySelector('.tj-widget-loader');

// height = widgetHeight - 4 (RenderWidget.jsx); a small enough widgetHeight
// produces a negative raw height, which is what LibraryComponent's clamp exists for.
const shortWidget = createWidgetHarness({
  componentType: 'LibraryComponent',
  handle: 'librarycomponent1',
  id: ID,
  defaultProperties: identityProperties,
  widgetHeight: 2,
});
const getWrapperDiv = () => getIframe()?.parentElement;

// LibraryComponent is lazy-loaded (editorHelpers.js) behind a `fallback={null}` Suspense,
// so absence assertions are vacuous until it has mounted. Its mount effect exposes
// setVisibility even when it renders nothing (license gate), so this is the signal.
const waitForMount = () => waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));

// jsdom gives a real iframe a real `contentWindow` even without navigating to
// `src` (jsdom never executes the shell's own JS), so the parent<->shell
// postMessage bridge can be driven directly: the listener in LibraryComponent.jsx
// only checks `e.source === iframeRef.current?.contentWindow`.
async function postFromShell(data, source = getIframe().contentWindow) {
  await act(async () => {
    window.dispatchEvent(new MessageEvent('message', { data, source }));
  });
}

function spyOnShellPostMessage() {
  return jest.spyOn(getIframe().contentWindow, 'postMessage');
}

// The visibility/showOnDesktop-showOnMobile gates live in WidgetWrapper (the real
// parent AppCanvas/Container mounts), not in RenderWidget or LibraryComponent
// itself — RenderWidget computes `resolvedWidgetVisibility` but only consumes it
// for a reflow side effect. Rendering bare RenderWidget (as `widget.render` does)
// never exercises the gate at all, so these scenarios mount the real
// WidgetWrapper -> RenderWidget chain instead.
function renderWrapped({
  properties = {},
  styles = {},
  others = {},
  currentMode = 'edit',
  currentLayout = 'desktop',
} = {}) {
  const definition = componentDefinition(ID, 'librarycomponent1', 'LibraryComponent', {
    ...identityProperties,
    ...properties,
  });
  definition.component.definition.styles = {
    boxShadow: binding('0px 0px 0px 0px #00000040'),
    ...styles,
  };
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
    ...others,
  };
  // componentDefinition() seeds only a desktop layout; a real drop writes both.
  definition.layouts.mobile = { ...definition.layouts.desktop };
  seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode(currentMode, MODULE_ID);
  return widget.session.render(
    <WidgetWrapper
      id={ID}
      moduleId={MODULE_ID}
      currentLayout={currentLayout}
      inCanvas={true}
      mode={currentMode}
      darkMode={false}
      gridWidth={10}
      onOptionChange={() => {}}
      onOptionsChange={() => {}}
    />
  );
}

// Edit-mode WidgetWrapper suspends on ConfigHandle's lazy MentionComponentInChat; on a cold
// Jest cache that first transform took over 20s, so it is preloaded once in beforeAll instead.
const WRAPPER_MOUNT_TIMEOUT = 3000;
const PRELOAD_TIMEOUT = 120000;

function resetLibraryStore() {
  useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: {}, devPreviewEmailsByUserId: {} });
}

describe('LibraryComponent integration', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'), PRELOAD_TIMEOUT);

  beforeEach(() => {
    widget.setup();
    setPin('v1');
  });
  afterEach(() => {
    widget.teardown();
    jest.restoreAllMocks();
    resetLibraryStore();
  });

  test('[LibraryComponent-SLOT-001] an unconfigured instance renders the Slot placeholder, not an iframe', async () => {
    // Break this catches: rendering the iframe (or nothing) instead of the Slot
    // placeholder when `configured` is false — a builder dragging in a Custom-tab
    // component before it's wired up would see a broken/empty widget instead of
    // a clear "not set up yet" affordance.
    widget.render({ properties: { componentName: binding('') } });

    expect(await screen.findByText('Slot')).toBeInTheDocument();
    expect(getIframe()).toBeNull();
  });

  test('[LibraryComponent-SLOT-002] the Slot honors setVisibility and ignores loading', async () => {
    // Break this catches: the Slot branch ignoring the local visibility state (a
    // hidden unconfigured instance stays visible), or swapping the placeholder for a
    // loader so a builder loses the "not set up yet" affordance.
    widget.render({ properties: { componentName: binding(''), loadingState: binding('{{true}}') } });

    const slot = await screen.findByText('Slot');
    expect(getLoader()).toBeNull();

    await widget.act('setLoading', true);
    expect(screen.getByText('Slot')).toBeInTheDocument();
    expect(getLoader()).toBeNull();

    await widget.act('setVisibility', false);
    expect(slot).toHaveStyle({ display: 'none' });
  });

  test('[LibraryComponent-COMBO-002] any single missing identity field falls back to the Slot placeholder', async () => {
    // Break this catches: `configured = Boolean(libraryId && componentName && effectiveRevision)`
    // losing one of its three ANDed terms, which would let a partially-configured
    // instance fall through to the iframe branch with a broken bundle URL instead
    // of the placeholder.
    widget.render({ properties: { libraryId: binding('') } });
    expect(await screen.findByText('Slot')).toBeInTheDocument();

    widget.render({ properties: { componentName: binding('') } });
    expect(await screen.findByText('Slot')).toBeInTheDocument();

    // effectiveRevision unresolvable: no pin for this library, and there is no
    // per-instance fallback.
    setPin(undefined);
    widget.render();
    expect(await screen.findByText('Slot')).toBeInTheDocument();
  });

  test('[LibraryComponent-COMBO-003] visibility: false collapses the Slot placeholder the same as a configured instance', async () => {
    // Break this catches: the Slot branch bypassing WidgetWrapper's visibility
    // collapse (e.g. rendering at full height regardless of `visibility`), which
    // would make an intentionally-hidden unconfigured instance still take up
    // visible space in the app.
    renderWrapped({ properties: { componentName: binding(''), visibility: binding('{{false}}') } });

    // Still in the DOM (edit mode never unmounts a hidden widget — it collapses
    // it, see HIDDEN_COMPONENT_HEIGHT) — but collapsed to zero height.
    expect(await screen.findByText('Slot', {}, { timeout: WRAPPER_MOUNT_TIMEOUT })).toBeInTheDocument();
    await waitFor(() => expect(getWrapperEl()).toHaveStyle({ height: '0px' }), { timeout: WRAPPER_MOUNT_TIMEOUT });
  });

  test('[LibraryComponent-LAYOUT-001] showOnDesktop / showOnMobile gate rendering per surface', async () => {
    // Break this catches: reading the wrong layout's flag (or none at all), which
    // would show a widget on a surface its builder explicitly hid it from.
    renderWrapped({ others: { showOnDesktop: binding('{{true}}') } });
    await waitFor(() => expect(getWrapperEl()).toBeInTheDocument(), { timeout: WRAPPER_MOUNT_TIMEOUT });

    renderWrapped({ others: { showOnDesktop: binding('{{false}}') } });
    await waitFor(() => expect(getWrapperEl()).toBeNull());

    renderWrapped({ others: { showOnMobile: binding('{{true}}') }, currentLayout: 'mobile' });
    await waitFor(() => expect(getWrapperEl()).toBeInTheDocument());

    renderWrapped({ others: { showOnMobile: binding('{{false}}') }, currentLayout: 'mobile' });
    await waitFor(() => expect(getWrapperEl()).toBeNull());
  });

  test('[LibraryComponent-STYLE-001] visibility: false collapses a configured instance to zero height', async () => {
    // Break this catches: the configured iframe branch skipping the shared
    // visibility gate that every other widget goes through.
    // See WRAPPER_MOUNT_TIMEOUT.
    renderWrapped({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(getIframe()).toBeInTheDocument(), { timeout: WRAPPER_MOUNT_TIMEOUT });
    await waitFor(() => expect(getWrapperEl()).toHaveStyle({ height: '0px' }), { timeout: WRAPPER_MOUNT_TIMEOUT });
  });

  test('[LibraryComponent-STYLE-002] boxShadow applies to the iframe element', async () => {
    // Break this catches: dropping `styles.boxShadow` from the iframe's inline
    // style object, or reading it from the wrong bucket.
    widget.render({ styles: { boxShadow: binding('2px 2px 4px 0px #000000ff') } });

    await waitFor(() => expect(getIframe()).toHaveStyle({ boxShadow: '2px 2px 4px 0px #000000ff' }));
  });

  test('[LibraryComponent-SANDBOX-001] the iframe is an opaque-origin sandbox with an accessible name', async () => {
    // Break this catches: adding `allow-same-origin` (or any other token) to the
    // sandbox, which would hand uploaded/dev-pushed bundle JS the parent's DOM and
    // cookies; pointing `src` at anything but the fixed shell; or losing the title
    // that gives assistive tech a name for the frame.
    widget.render();

    const iframe = await screen.findByTitle('Widget');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.getAttribute('src')).toBe('/assets/custom-components/shell.html');
  });

  test('[LibraryComponent-HANDSHAKE-001] a configured instance completes the ready -> load -> props handshake', async () => {
    // Break this catches: posting `load`/`props` before `ready` arrives (the
    // iframe hasn't attached its own listener yet, so the message is lost), or
    // dropping either message from the sequence.
    widget.render({ properties: { componentName: binding('Widget') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    const postToShell = spyOnShellPostMessage();

    await postFromShell({ type: 'ready' });

    expect(postToShell).toHaveBeenCalledWith(expect.objectContaining({ type: 'load', componentName: 'Widget' }), '*');
    expect(postToShell).toHaveBeenCalledWith(expect.objectContaining({ type: 'props' }), '*');
    // load before props, not the other way around.
    const loadCallIndex = postToShell.mock.calls.findIndex(([msg]) => msg.type === 'load');
    const propsCallIndex = postToShell.mock.calls.findIndex(([msg]) => msg.type === 'props');
    expect(loadCallIndex).toBeGreaterThanOrEqual(0);
    expect(loadCallIndex).toBeLessThan(propsCallIndex);
  });

  test('[LibraryComponent-PROPS-001] property changes are forwarded to the shell with identity keys excluded', async () => {
    // Break this catches: forwarding the raw `properties` object (leaking
    // libraryId/correlationId/libraryName/componentName to the author's code),
    // or failing to re-post `props` on a later change.
    widget.render({ properties: { componentName: binding('Widget') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    await postFromShell({ type: 'ready' });

    const postToShell = spyOnShellPostMessage();
    await act(async () => {
      widget.setComponentProperty(ID, 'label', 'hello', 'properties');
    });

    await waitFor(() => {
      const propsCall = postToShell.mock.calls.find(([msg]) => msg.type === 'props');
      expect(propsCall).toBeDefined();
      expect(propsCall[0].data).toEqual({ label: 'hello' });
    });
  });

  test('[LibraryComponent-PROPS-002] visibility is excluded from the shell props, like the identity keys', async () => {
    // Break this catches: treating `visibility` as an ordinary CCL prop and leaking
    // it into the author's component props alongside libraryId/correlationId/etc.
    widget.render({ properties: { componentName: binding('Widget'), visibility: binding('{{true}}') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    await postFromShell({ type: 'ready' });

    const postToShell = spyOnShellPostMessage();
    await act(async () => {
      widget.setComponentProperty(ID, 'label', 'hello', 'properties');
    });

    await waitFor(() => {
      const propsCall = postToShell.mock.calls.find(([msg]) => msg.type === 'props');
      expect(propsCall).toBeDefined();
      expect(propsCall[0].data).toEqual({ label: 'hello' });
    });
  });

  test('[LibraryComponent-PROPS-003] loadingState is excluded from the shell props, like the identity keys', async () => {
    // Break this catches: treating `loadingState` as an ordinary CCL prop and leaking
    // it into the author's component props alongside libraryId/correlationId/etc.
    // Kept false (unlike PROPS-002's visibility: true) — a true loadingState now
    // unmounts the iframe entirely (LOADING-003), which this test isn't exercising.
    widget.render({ properties: { componentName: binding('Widget'), loadingState: binding('{{false}}') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    await postFromShell({ type: 'ready' });

    const postToShell = spyOnShellPostMessage();
    await act(async () => {
      widget.setComponentProperty(ID, 'label', 'hello', 'properties');
    });

    await waitFor(() => {
      const propsCall = postToShell.mock.calls.find(([msg]) => msg.type === 'props');
      expect(propsCall).toBeDefined();
      expect(propsCall[0].data).toEqual({ label: 'hello' });
    });
  });

  test('[LibraryComponent-STATE-001] a stateChange message updates the matching exposed variable', async () => {
    // Break this catches: not calling `setExposedVariable`, or writing under
    // the wrong key/value pair from the message.
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    await postFromShell({ type: 'stateChange', key: 'count', value: 5 });

    await waitFor(() => expect(widget.exposed().count).toBe(5));
  });

  test('[LibraryComponent-EVENT-001] an author-defined event name fires and bypasses the platform whitelist', async () => {
    // Break this catches: routing the event through the normal (non-bypass) path,
    // which would silently no-op for any event name outside the platform's
    // hardcoded list — every custom-component-authored event name would go dark.
    widget.setEvents(setVariableOn(ID, 'onWidgetSaved'));
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());

    await postFromShell({ type: 'event', name: 'onWidgetSaved' });

    await waitFor(() => expect(widget.variables().seen).toBe('YES'));
  });

  test('[LibraryComponent-ISO-001] shell messages reach only their own instance', async () => {
    // Break this catches: dropping the `e.source === iframeRef.current?.contentWindow`
    // check — every LibraryComponent on the page would then apply every other
    // instance's state changes and fire its events, and any window could inject them.
    const sibling = componentDefinition(SIBLING_ID, 'librarycomponent2', 'LibraryComponent', identityProperties);
    sibling.component.definition.styles = { boxShadow: binding('0px 0px 0px 0px #00000040') };
    widget.setEvents(setVariableOn(ID, 'onWidgetSaved'));
    widget.render({
      extraComponents: { [SIBLING_ID]: sibling },
      also: [{ id: SIBLING_ID, componentType: 'LibraryComponent' }],
    });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    await waitFor(() => expect(getIframe('librarycomponent2')).toBeInTheDocument());

    await postFromShell({ type: 'stateChange', key: 'count', value: 1 });
    await waitFor(() => expect(widget.exposed().count).toBe(1));
    expect(widget.exposed(SIBLING_ID).count).toBeUndefined();

    await postFromShell({ type: 'stateChange', key: 'count', value: 2 }, getIframe('librarycomponent2').contentWindow);
    await waitFor(() => expect(widget.exposed(SIBLING_ID).count).toBe(2));
    expect(widget.exposed().count).toBe(1);

    await postFromShell({ type: 'event', name: 'onWidgetSaved' }, getIframe('librarycomponent2').contentWindow);
    await postFromShell({ type: 'stateChange', key: 'count', value: 99 }, window);
    await act(drain);
    expect(widget.variables().seen).toBeUndefined();
    expect(widget.exposed().count).toBe(1);
    expect(widget.exposed(SIBLING_ID).count).toBe(2);
  });

  test('[LibraryComponent-ACTION-001] a manifest-declared action becomes a callable exposed variable', async () => {
    // Break this catches: not registering manifest actions as exposed variables,
    // or the invoke/actionResult round trip losing the response.
    widget.render();
    await waitFor(() => expect(widget.exposed().reset).toBeInstanceOf(Function));

    const postToShell = spyOnShellPostMessage();
    let result;
    const invoked = act(async () => {
      result = await widget.exposed().reset();
    });

    await waitFor(() =>
      expect(postToShell).toHaveBeenCalledWith(expect.objectContaining({ type: 'invokeAction', name: 'reset' }), '*')
    );
    const [invokeMsg] = postToShell.mock.calls.find(([msg]) => msg.type === 'invokeAction');
    await postFromShell({ type: 'actionResult', id: invokeMsg.id, result: 'done' });
    await invoked;

    expect(result).toBe('done');
  });

  test('[LibraryComponent-ACTION-002] a pending action invocation is rejected when the component is removed mid-flight', async () => {
    // Break this catches: leaving a caller's promise unresolved forever when the
    // component unmounts before the shell responds.
    widget.render();
    await waitFor(() => expect(widget.exposed().reset).toBeInstanceOf(Function));

    let rejection;
    const invoked = widget
      .exposed()
      .reset()
      .catch((error) => {
        rejection = error;
      });

    await act(async () => {
      widget.session.render(<div />);
    });
    await invoked;

    expect(rejection).toBeInstanceOf(Error);
  });

  test('[LibraryComponent-ACTION-005] a shell reload rejects pending action invocations', async () => {
    // Break this catches: a reloaded shell (dev push, iframe remount) never answering
    // an invocation id it has never seen, leaving the caller's promise hanging forever.
    widget.render();
    await waitFor(() => expect(widget.exposed().reset).toBeInstanceOf(Function));

    let rejection;
    const invoked = widget
      .exposed()
      .reset()
      .catch((error) => {
        rejection = error;
      });

    await postFromShell({ type: 'ready' });
    await invoked;

    expect(rejection).toBeInstanceOf(Error);
  });

  test('[LibraryComponent-ACTION-006] manifest actions follow the rendered component across a reset', async () => {
    // Break this catches: a switched component keeping the previous component's
    // actions callable (they would post invocations the new bundle can't answer), or
    // the reset wiping the new component's actions after they were registered.
    widget.render();
    await waitFor(() => expect(widget.exposed().reset).toBeInstanceOf(Function));

    await act(async () => {
      widget.setComponentProperty(ID, 'componentName', 'OtherWidget', 'properties');
    });

    await waitFor(() => expect(widget.exposed().refresh).toBeInstanceOf(Function));
    expect(widget.exposed().reset).toBeUndefined();
  });

  test('[LibraryComponent-ACTION-003] setVisibility is exposed as a callable action, like every other widget', async () => {
    // Break this catches: EventManager's "Control Component -> Set visibility" action
    // invoking `components.x.setVisibility(...)` and finding it's not a function —
    // the static setVisibility action now shows up in the picker (EventManager.jsx)
    // but was never wired up as a real exposed variable on the widget itself.
    widget.render();

    await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));
  });

  test('[LibraryComponent-VISIBILITY-001] calling setVisibility(false) exposes isVisible: false and hides the widget', async () => {
    // Break this catches: setVisibility updating the exposed value without hiding the
    // widget, or hiding it without updating `isVisible` for bindings that read it.
    widget.render();
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

    await widget.act('setVisibility', false);

    expect(widget.exposed().isVisible).toBe(false);
    expect(getWrapperDiv()).toHaveStyle({ display: 'none' });
  });

  test('[LibraryComponent-VISIBILITY-002] the visibility property drives isVisible', async () => {
    // Break this catches: `isVisible` being seeded once at mount and never following a
    // later change to the `visibility` binding, so dependents read a stale value.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));

    await act(async () => {
      widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    });

    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
    expect(getWrapperDiv()).toHaveStyle({ display: 'block' });
  });

  test('[LibraryComponent-ACTION-004] setLoading is exposed as a callable action, like every other widget', async () => {
    // Break this catches: the static setLoading action showing up in the picker
    // (EventManager.jsx) but never wired up as a real exposed variable on the
    // widget itself, mirroring ACTION-003's coverage of setVisibility.
    widget.render();

    await waitFor(() => expect(widget.exposed().setLoading).toBeInstanceOf(Function));
  });

  test('[LibraryComponent-LOADING-001] calling setLoading(true) exposes isLoading: true and renders a loading overlay', async () => {
    // Break this catches: setLoading updating `isLoading` without showing the loader,
    // leaving users with an interactive component that claims to be loading.
    widget.render();
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));

    await widget.act('setLoading', true);

    expect(widget.exposed().isLoading).toBe(true);
    expect(getLoader()).toBeInTheDocument();
  });

  test('[LibraryComponent-LOADING-002] calling setLoading(false) after true clears isLoading and removes the overlay', async () => {
    // Break this catches: setLoading ignoring a falsy value, which would leave the
    // component stuck behind the loader forever once it has been set loading.
    widget.render();
    await widget.act('setLoading', true);
    expect(getLoader()).toBeInTheDocument();

    await widget.act('setLoading', false);

    expect(widget.exposed().isLoading).toBe(false);
    expect(getLoader()).toBeNull();
  });

  test('[LibraryComponent-LOADING-003] setLoading(true) unmounts the iframe entirely, not just visually', async () => {
    // Break this catches: rendering the loader on top of a still-mounted iframe (an
    // overlay), which would leave the sandboxed component interactive/focusable
    // underneath instead of tearing it down like IFrame.jsx does for its own loadingState.
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());

    await widget.act('setLoading', true);

    expect(getIframe()).toBeNull();

    await widget.act('setLoading', false);

    expect(getIframe()).toBeInTheDocument();
  });

  test('[LibraryComponent-LOADING-004] the loadingState property drives isLoading and the loader', async () => {
    // Break this catches: the `loadingState` binding being read only at mount — a
    // query-bound loading state would then never clear, or never show.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(getLoader()).toBeInTheDocument();
    expect(getIframe()).toBeNull();

    await act(async () => {
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });

    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    expect(getIframe()).toBeInTheDocument();
  });

  test('[LibraryComponent-CSA-001] action state survives unrelated or no-op property resolution', async () => {
    // Break this catches: the property-sync effect re-running on every render (or
    // every resolution) and silently undoing a setVisibility/setLoading call the
    // moment anything else on the component changes.
    widget.render();
    await widget.act('setVisibility', false);
    await widget.act('setLoading', true);

    await act(async () => {
      widget.setComponentProperty(ID, 'label', 'unrelated', 'properties');
    });
    await act(async () => {
      widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });
    await act(drain);

    expect(widget.exposed().isVisible).toBe(false);
    expect(widget.exposed().isLoading).toBe(true);
    expect(getLoader()).toBeInTheDocument();
    expect(getLoader().closest('.tw-relative')).toHaveStyle({ display: 'none' });
  });

  test('[LibraryComponent-CSA-002] a genuine property change overrides action state', async () => {
    // Break this catches: action state permanently shadowing the property, so a
    // builder's changed `visibility`/`loadingState` binding stops having any effect
    // after the first setVisibility/setLoading call.
    widget.render();
    await widget.act('setVisibility', false);
    await widget.act('setLoading', true);

    await act(async () => {
      widget.setComponentProperty(ID, 'visibility', '{{false}}', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
    });
    await act(async () => {
      widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });

    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    expect(getIframe()).toBeInTheDocument();
    expect(getWrapperDiv()).toHaveStyle({ display: 'block' });
  });

  test('[LibraryComponent-ERROR-001] a shell error message is logged, not surfaced visibly', async () => {
    // Break this catches: throwing, crashing, or silently dropping shell error
    // messages instead of the current console.error-only path.
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await postFromShell({ type: 'error', message: 'boom' });

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(getIframe()).toBeInTheDocument();
  });

  test('[LibraryComponent-ERROR-002] a configured instance referencing a nonexistent library degrades without a distinct error UI', async () => {
    // Break this catches: a 404 or a malformed manifest crashing the widget (an
    // unhandled rejection from the shared manifest fetch) or falling back to the
    // Slot placeholder instead of the ordinary configured render.
    widget.render({ properties: { libraryId: binding('missing-lib') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(screen.queryByText('Slot')).not.toBeInTheDocument();

    widget.render({ properties: { libraryId: binding('bad-lib') } });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    // Awaits the same deduped request the widget started, so a rejection surfaces here.
    await act(async () => {
      await useCustomComponentLibrariesStore.getState().fetchManifest('bad-lib', 'v1');
    });
    expect(getIframe()).toBeInTheDocument();
    expect(screen.queryByText('Slot')).not.toBeInTheDocument();
    expect(widget.exposed().reset).toBeUndefined();
  });

  test('[LibraryComponent-COMBO-004] an identity change and a dev-nonce-only bump each force an iframe remount', async () => {
    // Break this catches: NOT keying the iframe on identity (stale bundle after
    // switching libraries) or NOT keying it on the dev nonce (a dev-bundle push
    // reusing the old iframe instead of a fresh shell environment).
    // Dev-pinned so `devNonce` is actually read into the key (isDevPin gates it) —
    // otherwise the nonce-bump half of this test would pass for the wrong reason.
    setPin('dev:user-1');
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    const firstIframe = getIframe();

    await act(async () => {
      widget.setComponentProperty(ID, 'componentName', 'OtherWidget', 'properties');
    });
    await waitFor(() => expect(getIframe().title).toBe('OtherWidget'));
    expect(getIframe()).not.toBe(firstIframe);
    const secondIframe = getIframe();

    await act(async () => {
      useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: { [LIBRARY_ID]: 1 } });
    });
    await waitFor(() => expect(getIframe()).not.toBe(secondIframe));
    expect(getIframe()).toBeInTheDocument();
  });

  test('[LibraryComponent-DEVRELOAD-001] a dev-bundle nonce change resets exposed variables, but mounting does not', async () => {
    // Break this catches: resetting on mount (wiping out a freshly-loaded
    // exposed value before anything changed) or never resetting on a real push
    // (leaving a removed useStateX variable's stale value in the Inspector).
    // Spied at the store boundary rather than inferred from timing, because a
    // reset that fires at mount (before any value is set) is otherwise
    // indistinguishable from one that never fires at all.
    act(() => {
      useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: { [LIBRARY_ID]: 1 } });
    });
    const resetSpy = jest.spyOn(store(), 'resetComponentExposedValues');

    setPin('dev:user-1');
    widget.render();
    // LibraryComponent's own mount effects have run (not just RenderWidget's).
    await waitForMount();
    await act(drain);

    expect(resetSpy).not.toHaveBeenCalled();

    await act(async () => {
      useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: { [LIBRARY_ID]: 2 } });
    });

    await waitFor(() => expect(resetSpy).toHaveBeenCalledWith(ID, MODULE_ID));
  });

  test('[LibraryComponent-RESET-001] exposed variables reset when the rendered revision changes, with no dev pin involved', async () => {
    // Break this catches: keying the reset on the dev nonce alone instead of also on
    // the rendered identity — switching published revisions would then leave the old
    // revision's state keys and actions behind.
    // Spied before render: a spy installed later swaps the store action, which gives
    // RenderWidget a new resetExposedVariables callback and fires the reset on its own.
    const resetSpy = jest.spyOn(store(), 'resetComponentExposedValues');
    widget.render();
    await waitForMount();
    await act(drain);
    expect(resetSpy).not.toHaveBeenCalled();

    setPin('v2');

    await waitFor(() => expect(resetSpy).toHaveBeenCalledWith(ID, MODULE_ID));
    await act(drain);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  test('[LibraryComponent-RESET-002] setVisibility/setLoading/isVisible/isLoading survive an identity-change reset', async () => {
    // Break this catches: the mount-only registration effect (deps=[]) never re-running
    // after resetExposedVariables() wipes currentState[id] on a componentName/revision/
    // dev-nonce change — regresses to setVisibility/setLoading being undefined and
    // isVisible/isLoading missing from the Inspector's public interface.
    widget.render();
    await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);
    expect(widget.exposed().isVisible).toBe(false);

    await act(async () => {
      widget.setComponentProperty(ID, 'componentName', 'OtherWidget', 'properties');
    });

    await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));
    expect(widget.exposed().setLoading).toBeInstanceOf(Function);
    expect(widget.exposed().isVisible).not.toBeUndefined();
    expect(widget.exposed().isLoading).not.toBeUndefined();

    await widget.act('setVisibility', true);
    expect(widget.exposed().isVisible).toBe(true);
  });

  test('[LibraryComponent-DEVBADGE-001] a dev pin shows the developer badge in edit mode', async () => {
    // Break this catches: a builder previewing someone's dev bundle with no visible
    // cue, or a badge that stays blank until the email list loads instead of falling
    // back to the user id.
    setPin('dev:user-1');
    widget.render();
    expect(await screen.findByText('dev: user-1')).toBeInTheDocument();

    act(() => {
      useCustomComponentLibrariesStore.setState({ devPreviewEmailsByUserId: { 'user-1': 'dev@example.com' } });
    });
    expect(await screen.findByText('dev: dev@example.com')).toBeInTheDocument();

    widget.render({ properties: { componentName: binding('') } });
    expect(await screen.findByText('Slot')).toBeInTheDocument();
    expect(screen.getByText('dev: dev@example.com')).toBeInTheDocument();
  });

  test('[LibraryComponent-DEVBADGE-002] no badge in view mode or for a published pin', async () => {
    // Break this catches: leaking the editor-only dev badge into a running app, or
    // badging every instance regardless of whether its pin is a dev bundle.
    setLicenseAccess(true);
    setPin('dev:user-1');
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(screen.queryByText(/^dev:/)).not.toBeInTheDocument();
    setLicenseAccess(false);

    setPin('v1');
    widget.render();
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(screen.queryByText(/^dev:/)).not.toBeInTheDocument();
  });
});

describe('LibraryComponent license gating', () => {
  beforeEach(() => {
    widget.setup();
    setPin('v1');
  });
  afterEach(() => {
    widget.teardown();
    setLicenseAccess(false);
  });

  test('[LibraryComponent-LICENSE-001] a configured instance renders nothing in view mode without CCL license access', async () => {
    // Break this catches: an app viewer seeing a live CCL component (or its Slot
    // placeholder) despite the workspace not being licensed for the feature at all.
    setLicenseAccess(false);
    widget.render({ currentMode: 'view' });
    await waitForMount();

    expect(getIframe()).toBeNull();
    expect(screen.queryByText('Slot')).not.toBeInTheDocument();
  });

  test('[LibraryComponent-LICENSE-002] a configured instance still renders in view mode with CCL license access', async () => {
    // Break this catches: gating on view mode alone, which would hide every CCL
    // component from licensed workspaces' end users.
    setLicenseAccess(true);
    widget.render({ currentMode: 'view' });

    await waitFor(() => expect(getIframe()).toBeInTheDocument());
  });

  test('[LibraryComponent-LICENSE-003] in edit mode without access, the instance still renders but is dimmed and inert', async () => {
    // Break this catches: hiding the widget in the builder canvas the same as at
    // runtime, which would leave a builder unable to even see/select/delete it —
    // edit mode must show a dimmed, non-interactive instance instead of nothing.
    setLicenseAccess(false);
    widget.render({ currentMode: 'edit' });

    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(getIframe().parentElement).toHaveClass('tw-opacity-50', 'tw-pointer-events-none');
  });

  test('[LibraryComponent-LICENSE-004] in edit mode with access, the instance renders without the dimmed styling', async () => {
    // Break this catches: dimming every instance in the editor, making licensed
    // builders' components look disabled and swallow pointer events.
    setLicenseAccess(true);
    widget.render({ currentMode: 'edit' });

    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(getIframe().parentElement).not.toHaveClass('tw-opacity-50');
  });

  test('[LibraryComponent-LICENSE-005] license changes while mounted take effect without losing saved values', async () => {
    // Break this catches: reading the license once at mount (a lapse or renewal
    // needing a reload to apply), or a gate that clears the instance's identity so
    // re-licensing can't bring the component back.
    setLicenseAccess(true);
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(getIframe()).toBeInTheDocument());

    setLicenseAccess(false);
    await waitFor(() => expect(getIframe()).toBeNull());
    const saved = store().getComponentDefinition(ID, MODULE_ID).component.definition.properties;
    expect(saved.libraryId.value).toBe(LIBRARY_ID);
    expect(saved.componentName.value).toBe('Widget');

    setLicenseAccess(true);
    await waitFor(() => expect(getIframe()).toBeInTheDocument());
  });

  test('[LibraryComponent-LICENSE-006] license gating on the unconfigured Slot', async () => {
    // Break this catches: an unlicensed viewer seeing an unconfigured placeholder,
    // or the editor Slot being dimmed like a configured instance (it has nothing to
    // disable and must stay a clear "not set up yet" cue).
    setLicenseAccess(false);
    widget.render({ currentMode: 'view', properties: { componentName: binding('') } });
    await waitForMount();
    expect(screen.queryByText('Slot')).not.toBeInTheDocument();

    widget.render({ currentMode: 'edit', properties: { componentName: binding('') } });
    const slot = await screen.findByText('Slot');
    expect(slot).not.toHaveClass('tw-opacity-50');
  });
});

describe('LibraryComponent height clamp', () => {
  beforeEach(() => {
    shortWidget.setup();
    setPin('v1');
  });
  afterEach(() => shortWidget.teardown());

  test('[LibraryComponent-STYLE-004] a negative resolved height is clamped to 0 before reaching the iframe wrapper', async () => {
    // Break this catches: removing `Math.max(height ?? 0, 0)`, which would leak
    // a negative height number into the DOM (invalid CSS, collapses oddly
    // across browsers) whenever a hidden-mode layout calculation yields one.
    shortWidget.render();

    // widgetHeight=2 -> height = 2 - 4 = -2 (RenderWidget.jsx) -> clamped to 0.
    await waitFor(() => expect(getWrapperDiv()).toHaveStyle({ height: '0px' }));
  });
});
