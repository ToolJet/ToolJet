import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  MODULE_ID,
  store,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { seedApp, componentDefinition } from '@/test/app-builder';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';

const ID = 'lib1';
const LIBRARY_ID = 'lib-1';
const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';

const manifest = {
  components: {
    Widget: {
      displayName: 'Widget',
      props: [],
      events: [],
      actions: [{ name: 'reset', displayName: 'Reset' }],
    },
  },
};

const widget = createWidgetHarness({
  componentType: 'LibraryComponent',
  handle: 'librarycomponent1',
  id: ID,
  defaultProperties: {
    libraryId: binding(LIBRARY_ID),
    correlationId: binding(CORRELATION_ID),
    libraryName: binding('My UI Library'),
    componentName: binding('Widget'),
    revisionId: binding('v1'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
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
        url: 'http://localhost:3000/api/custom-component-libraries/:libraryId/revisions/:revision/files/manifest.json',
        json: manifest,
      },
    ],
  },
});

const getIframe = () => document.querySelector('iframe[data-cy="librarycomponent1"]');
const getWrapperEl = () => document.querySelector(`.ele-${ID}`);

// height = widgetHeight - 4 (RenderWidget.jsx); a small enough widgetHeight
// produces a negative raw height, which is what LibraryComponent's clamp exists for.
const shortWidget = createWidgetHarness({
  componentType: 'LibraryComponent',
  handle: 'librarycomponent1',
  id: ID,
  defaultProperties: {
    libraryId: binding(LIBRARY_ID),
    correlationId: binding(CORRELATION_ID),
    libraryName: binding('My UI Library'),
    componentName: binding('Widget'),
    revisionId: binding('v1'),
  },
  widgetHeight: 2,
});
const getWrapperDiv = () => getIframe()?.parentElement;

// jsdom gives a real iframe a real `contentWindow` even without navigating to
// `src` (jsdom never executes the shell's own JS), so the parent<->shell
// postMessage bridge can be driven directly: the listener in LibraryComponent.jsx
// only checks `e.source === iframeRef.current?.contentWindow`.
async function postFromShell(data) {
  const iframe = getIframe();
  await act(async () => {
    window.dispatchEvent(new MessageEvent('message', { data, source: iframe.contentWindow }));
  });
}

function spyOnShellPostMessage() {
  return jest.spyOn(getIframe().contentWindow, 'postMessage');
}

// The visibility/showOnDesktop-showOnMobile gates live in WidgetWrapper (the real
// parent AppCanvas/Container mounts), not in RenderWidget or LibraryComponent
// itself — RenderWidget computes `resolvedWidgetVisibility` but only consumes it
// for a reflow side effect. Rendering bare RenderWidget (as `widget.render` does)
// never exercises the gate at all, so these three scenarios mount the real
// WidgetWrapper -> RenderWidget chain instead.
function renderWrapped({ properties = {}, styles = {}, others = {}, currentMode = 'edit' } = {}) {
  const definition = componentDefinition(ID, 'librarycomponent1', 'LibraryComponent', {
    libraryId: binding(LIBRARY_ID),
    correlationId: binding(CORRELATION_ID),
    libraryName: binding('My UI Library'),
    componentName: binding('Widget'),
    revisionId: binding('v1'),
    ...properties,
  });
  definition.component.definition.styles = {
    visibility: binding('{{true}}'),
    boxShadow: binding('0px 0px 0px 0px #00000040'),
    ...styles,
  };
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
    ...others,
  };
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

describe('LibraryComponent integration', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[LibraryComponent-SLOT-001] an unconfigured instance renders the Slot placeholder, not an iframe', () => {
    // Break this catches: rendering the iframe (or nothing) instead of the Slot
    // placeholder when `configured` is false — a builder dragging in a Custom-tab
    // component before it's wired up would see a broken/empty widget instead of
    // a clear "not set up yet" affordance.
    widget.render({ properties: { componentName: binding('') } });

    expect(screen.getByText('Slot')).toBeInTheDocument();
    expect(getIframe()).toBeNull();
  });

  test('[LibraryComponent-COMBO-002] any single missing identity field falls back to the Slot placeholder', () => {
    // Break this catches: `configured = Boolean(libraryId && componentName && effectiveRevision)`
    // losing one of its three ANDed terms, which would let a partially-configured
    // instance fall through to the iframe branch with a broken bundle URL instead
    // of the placeholder.
    widget.render({ properties: { libraryId: binding('') } });
    expect(screen.getByText('Slot')).toBeInTheDocument();

    widget.render({ properties: { componentName: binding('') } });
    expect(screen.getByText('Slot')).toBeInTheDocument();

    // effectiveRevision unresolvable: no pin AND no instance revisionId.
    widget.render({ properties: { revisionId: binding('') } });
    expect(screen.getByText('Slot')).toBeInTheDocument();
  });

  test('[LibraryComponent-COMBO-003] visibility: false collapses the Slot placeholder the same as a configured instance', () => {
    // Break this catches: the Slot branch bypassing WidgetWrapper's visibility
    // collapse (e.g. rendering at full height regardless of `visibility`), which
    // would make an intentionally-hidden unconfigured instance still take up
    // visible space in the app.
    renderWrapped({ properties: { componentName: binding('') }, styles: { visibility: binding('{{false}}') } });

    // Still in the DOM (edit mode never unmounts a hidden widget — it collapses
    // it, see HIDDEN_COMPONENT_HEIGHT) — but collapsed to zero height.
    expect(screen.getByText('Slot')).toBeInTheDocument();
    expect(getWrapperEl()).toHaveStyle({ height: '0px' });
  });

  test('[LibraryComponent-LAYOUT-001] showOnDesktop / showOnMobile gate rendering per surface', () => {
    // Break this catches: reading the wrong layout's flag (or none at all), which
    // would show a widget on a surface its builder explicitly hid it from.
    renderWrapped({ others: { showOnDesktop: binding('{{false}}') } });

    expect(getWrapperEl()).toBeNull();
  });

  test('[LibraryComponent-STYLE-001] visibility: false collapses a configured instance to zero height', () => {
    // Break this catches: the configured iframe branch skipping the shared
    // visibility gate that every other widget goes through.
    renderWrapped({ styles: { visibility: binding('{{false}}') } });

    expect(getIframe()).toBeInTheDocument();
    expect(getWrapperEl()).toHaveStyle({ height: '0px' });
  });

  test('[LibraryComponent-STYLE-002] boxShadow applies to the iframe element', () => {
    // Break this catches: dropping `styles.boxShadow` from the iframe's inline
    // style object, or reading it from the wrong bucket.
    widget.render({ styles: { boxShadow: binding('2px 2px 4px 0px #000000ff') } });

    expect(getIframe()).toHaveStyle({ boxShadow: '2px 2px 4px 0px #000000ff' });
  });

  test('[LibraryComponent-HANDSHAKE-001] a configured instance completes the ready -> load -> props handshake', async () => {
    // Break this catches: posting `load`/`props` before `ready` arrives (the
    // iframe hasn't attached its own listener yet, so the message is lost), or
    // dropping either message from the sequence.
    widget.render({ properties: { componentName: binding('Widget') } });
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
    // libraryId/correlationId/libraryName/componentName/revisionId to the
    // author's code), or failing to re-post `props` on a later change.
    widget.render({ properties: { componentName: binding('Widget') } });
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
    await postFromShell({ type: 'stateChange', key: 'count', value: 5 });

    await waitFor(() => expect(widget.exposed().count).toBe(5));
  });

  test('[LibraryComponent-EVENT-001] an author-defined event name fires and bypasses the platform whitelist', async () => {
    // Break this catches: routing the event through the normal (non-bypass) path,
    // which would silently no-op for any event name outside the platform's
    // hardcoded list — every custom-component-authored event name would go dark.
    widget.setEvents(setVariableOn(ID, 'onWidgetSaved'));
    widget.render();

    await postFromShell({ type: 'event', name: 'onWidgetSaved' });

    await waitFor(() => expect(widget.variables().seen).toBe('YES'));
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

  test('[LibraryComponent-ERROR-001] a shell error message is logged, not surfaced visibly', async () => {
    // Break this catches: throwing, crashing, or silently dropping shell error
    // messages instead of the current console.error-only path.
    widget.render();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await postFromShell({ type: 'error', message: 'boom' });

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(getIframe()).toBeInTheDocument();
    consoleError.mockRestore();
  });

  test('[LibraryComponent-ERROR-002] a configured instance referencing a nonexistent library degrades without a distinct error UI', async () => {
    // Break this catches: a manifest-fetch 404 crashing the widget or falling
    // back to the Slot placeholder instead of the ordinary configured render.
    widget.render({ properties: { libraryId: binding('missing-lib') } });

    await waitFor(() => expect(getIframe()).toBeInTheDocument());
    expect(screen.queryByText('Slot')).not.toBeInTheDocument();
  });

  test('[LibraryComponent-COMBO-004] an identity change and a dev-nonce-only bump each force an iframe remount', async () => {
    // Break this catches: NOT keying the iframe on identity (stale bundle after
    // switching libraries) or NOT keying it on the dev nonce (a dev-bundle push
    // reusing the old iframe instead of a fresh shell environment).
    // Dev-pinned so `devNonce` is actually read into the key (isDevPin gates it) —
    // otherwise the nonce-bump half of this test would pass for the wrong reason.
    widget.render({ properties: { revisionId: binding('dev:user-1') } });
    const firstIframe = getIframe();

    await act(async () => {
      widget.setComponentProperty(ID, 'componentName', 'OtherWidget', 'properties');
    });
    await waitFor(() => expect(getIframe()).not.toBe(firstIframe));
    const secondIframe = getIframe();

    await act(async () => {
      useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: { [LIBRARY_ID]: 1 } });
    });
    await waitFor(() => expect(getIframe()).not.toBe(secondIframe));
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

    widget.render({ properties: { revisionId: binding('dev:user-1') } });
    await waitFor(() => expect(widget.exposed().id).toBe(ID)); // settle mount-time effects

    expect(resetSpy).not.toHaveBeenCalled();

    await act(async () => {
      useCustomComponentLibrariesStore.setState({ devBundleUpdatedAt: { [LIBRARY_ID]: 2 } });
    });

    await waitFor(() => expect(resetSpy).toHaveBeenCalledWith(ID, MODULE_ID));
  });
});

describe('LibraryComponent height clamp', () => {
  beforeEach(() => shortWidget.setup());
  afterEach(() => shortWidget.teardown());

  test('[LibraryComponent-STYLE-004] a negative resolved height is clamped to 0 before reaching the iframe wrapper', () => {
    // Break this catches: removing `Math.max(height ?? 0, 0)`, which would leak
    // a negative height number into the DOM (invalid CSS, collapses oddly
    // across browsers) whenever a hidden-mode layout calculation yields one.
    shortWidget.render();

    // widgetHeight=2 -> height = 2 - 4 = -2 (RenderWidget.jsx) -> clamped to 0.
    expect(getWrapperDiv()).toHaveStyle({ height: '0px' });
  });
});
