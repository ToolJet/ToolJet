import React from 'react';
import { waitFor, screen } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  drain,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { AppBuilderTestSession, componentDefinition, defineAppBuilderScenario, seedApp } from '@/test/app-builder';
import { customComponentConfig as frontendConfig } from '@tooljet/widget-definitions';
// eslint-disable-next-line import/no-relative-packages
import serverWidgets from '../../../../../../../server/src/modules/apps/services/widget-config';

const serverConfig = serverWidgets.customComponentConfig;

const ID = 'cc1';
const HANDLE = 'customComponent1';
const ID2 = 'cc2';
const HANDLE2 = 'customComponent2';

const REGISTERED_DATA = { title: 'Hi! There', buttonText: 'Update Title' };

/** The raw expression the Data field persists for an object literal. */
const dataExpr = (obj) => `{{${JSON.stringify(obj)}}}`;

const widget = createWidgetHarness({
  componentType: 'CustomComponent',
  handle: HANDLE,
  id: ID,
  widgetHeight: 140,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const frame = (container, handle = HANDLE) => root(container, handle)?.querySelector('iframe');
const exposedData = (id = ID) => widget.exposed(id)?.data;

/**
 * Records every message the host posts INTO the frame. This is the real
 * outbound half of the bridge: the host calls contentWindow.postMessage and
 * jsdom dispatches a genuine MessageEvent on that window.
 */
function recordFrameMessages(frameEl) {
  const seen = [];
  frameEl.contentWindow.addEventListener('message', (e) => seen.push(e.data));
  return seen;
}

const lastOfType = (seen, message) => [...seen].reverse().find((m) => m?.message === message);
const countOfType = (seen, message) => seen.filter((m) => m?.message === message).length;

/** Lets the posted MessageEvent be delivered and any resulting state settle. */
async function settle() {
  await widget.session.store.act(async () => {
    await drain();
    await drain();
  });
}

/** The window of the first frame rendered for a component id. */
const frameWindowOf = (componentId = ID) => document.querySelector(`iframe[data-id="${componentId}"]`)?.contentWindow;

/**
 * Delivers a message to the host the way a browser does: on `window`, with
 * the sending window as `event.source`. jsdom's postMessage never sets
 * `source`, so the sender has to be supplied explicitly.
 */
function deliver(data, source) {
  window.dispatchEvent(new MessageEvent('message', { data, source }));
}

/** Posts a message exactly as the embedded frame would post it. */
async function fromFrame(payload, componentId = ID, source = frameWindowOf(componentId)) {
  deliver({ from: 'customComponent', componentId, ...payload }, source);
  await settle();
}

async function setProperty(name, value, { componentId = ID, skipResolve = false } = {}) {
  await widget.session.store.act(() =>
    widget.setComponentProperty(componentId, name, value, 'properties', 'value', skipResolve)
  );
}

async function setStyle(name, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, name, value, 'styles'));
}

function ccDefinition(id, handle, properties = {}) {
  return componentDefinition(id, handle, 'CustomComponent', properties);
}

/** Seeds runjs queries, which are runnable with no datasource and no network. */
async function seedQueries(queries, moduleId = MODULE_ID) {
  await widget.session.store.act(async () => {
    store().dataQuery.setQueries(queries, moduleId);
    await drain();
  });
}

const runjs = (id, name, code, parameters) => ({
  id,
  name,
  kind: 'runjs',
  // `parameters` is injected into the query's scope only when the query
  // DECLARES at least one parameter, which is the documented authoring flow.
  options: { code, ...(parameters ? { parameters } : {}) },
  runOnPageLoad: false,
});

/** Posts RUN_QUERY as the frame would and waits for the query to settle. */
async function runQueryFromFrame({ queryName, parameters = {}, requestId, componentId = ID }) {
  deliver(
    {
      from: 'customComponent',
      componentId,
      message: 'RUN_QUERY',
      queryName,
      parameters: JSON.stringify(parameters),
      requestId,
    },
    frameWindowOf(componentId)
  );
  await settle();
  await new Promise((resolve) => setTimeout(resolve, 250));
}

/**
 * Creates a second module namespace in every slice this spec touches. Mirrors
 * `bootModule` in _stores/__tests__/integration/moduleIsolation.spec.js: no
 * single store action initialises a namespace, and a missing one surfaces as
 * `undefined is not an object` deep inside a slice.
 */
function bootModule(moduleId) {
  const s = store();
  s.initializeComponentsSlice(moduleId);
  s.initializeAppSlice(moduleId);
  s.initializeEventsSlice(moduleId);
  s.initializeResolvedSlice(moduleId);
  s.initializeDependencySlice(moduleId);
  s.initializeDataQuerySlice(moduleId);
  s.initializeModeSlice(moduleId);
  s.initializeLoaderSlice(moduleId);
  s.setEditorLoading(false, moduleId);
  s.setCurrentMode('view', moduleId);
  s.setApp({ appId: `app-${moduleId}` }, moduleId);
}

const responsesIn = (seen) => seen.filter((m) => m?.message === 'RUN_QUERY_RESPONSE');
const responseFor = (seen, requestId) => responsesIn(seen).find((m) => m.requestId === requestId);

describe('CustomComponent widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  // ---------------------------------------------------------------- rendering

  test('[CustomComponent-REN-001] Mount renders the bridge shell', async () => {
    // Break this catches: rendering no frame, rendering two frames, losing the
    // component test hook, or failing to bind the frame to the component id --
    // any of which silently breaks every message the bridge sends.
    const { container } = widget.render();

    const wrapper = root(container);
    expect(wrapper).toBeInTheDocument();
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(frame(container)).toHaveAttribute('data-id', ID);
    expect(wrapper).toHaveStyle({ height: '136px' });
  });

  test('[CustomComponent-REN-002] Saved apps carrying the removed visible key still load', async () => {
    // Break this catches: wiring properties.visible to real visibility (which
    // would hide every saved app that still carries it), or letting the two
    // independently maintained widget configs drift apart.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig.definition.properties).not.toHaveProperty('visible');
    expect(frontendConfig.properties).not.toHaveProperty('visible');

    const legacy = ccDefinition(ID, HANDLE);
    legacy.component.definition.properties.visible = binding('{{false}}');

    const { container } = widget.render({ afterSeed: undefined, properties: {} });
    const withoutKey = root(container).outerHTML;

    widget.teardown();
    widget.setup();
    const { container: legacyContainer } = widget.render({ properties: { visible: binding('{{false}}') } });

    expect(root(legacyContainer)).toBeVisible();
    expect(root(legacyContainer).querySelectorAll('iframe')).toHaveLength(1);
    expect(root(legacyContainer).outerHTML).toBe(withoutKey);
  });

  // -------------------------------------------------------------------- data

  test('[CustomComponent-DATA-001] Mount replaces the seeded exposed default with the resolved Data object', async () => {
    // Break this catches: never publishing the resolved object, so every
    // binding onto this component reads the raw registration wrapper forever.
    widget.session; // harness is set up
    const seeded = { [ID]: ccDefinition(ID, HANDLE) };
    const { seedApp } = require('@/test/app-builder');
    seedApp(seeded, { moduleId: MODULE_ID });
    expect(exposedData()).toEqual({ value: frontendConfig.exposedVariables.data.value });

    widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    expect(exposedData().title).toBe('Hi! There');
  });

  test('[CustomComponent-DATA-002] A Data property change republishes the value and notifies the frame', async () => {
    // Break this catches: dropping the property effect, so author code keeps
    // rendering stale data after a binding resolves to something new.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    const seen = recordFrameMessages(frame(container));

    await setProperty('data', dataExpr({ name: 'Ada', status: 'Active' }));

    await waitFor(() => expect(exposedData()).toEqual({ name: 'Ada', status: 'Active' }));
    await waitFor(() => expect(lastOfType(seen, 'DATA_UPDATED')).toBeDefined());
    expect(lastOfType(seen, 'DATA_UPDATED')).toMatchObject({
      componentId: ID,
      data: { name: 'Ada', status: 'Active' },
    });
  });

  test('[CustomComponent-DATA-003] Empty, invalid and unserializable Data values', async () => {
    // Break this catches: crashing the bridge on a non-object Data value, or
    // re-publishing on a change the JSON effect key cannot see (which would
    // reset author state on every unrelated re-resolution).
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    await setProperty('data', dataExpr({ a: 1 }));
    await waitFor(() => expect(exposedData()).toEqual({ a: 1 }));

    // A non-object value fails the registered object schema and falls back to
    // its declared default rather than reaching the frame as a bare string.
    await setProperty('data', '{{"not an object"}}');
    await waitFor(() => expect(exposedData()).toEqual({}));
    expect(frame(container)).toBeInTheDocument();

    await setProperty('data', dataExpr({}));
    await waitFor(() => expect(exposedData()).toEqual({}));
    expect(frame(container)).toBeInTheDocument();

    // Only unserializable members differ, so the JSON effect key is unchanged.
    await setProperty('data', '{{({ a: 1, fn: undefined })}}');
    await waitFor(() => expect(exposedData()).toEqual({ a: 1 }));
    const seen = recordFrameMessages(frame(container));
    await setProperty('data', '{{({ a: 1, fn: () => 2 })}}');
    await settle();
    expect(countOfType(seen, 'DATA_UPDATED')).toBe(0);
  });

  // -------------------------------------------------------------------- code

  test('[CustomComponent-CODE-001] A Code change notifies the frame with the live data', async () => {
    // Break this catches: sending the property data instead of the live data,
    // which would silently discard every author update on a code edit.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'Author set this' } });
    await waitFor(() => expect(exposedData().title).toBe('Author set this'));

    const seen = recordFrameMessages(frame(container));
    await setProperty('code', 'const Next = () => null;', { skipResolve: true });

    await waitFor(() => expect(lastOfType(seen, 'CODE_UPDATED')).toBeDefined());
    expect(lastOfType(seen, 'CODE_UPDATED')).toMatchObject({
      componentId: ID,
      code: 'const Next = () => null;',
      data: { title: 'Author set this' },
    });
  });

  test('[CustomComponent-CODE-002] Code is never resolved as a binding', async () => {
    // Break this catches: dropping skipResolve, which would evaluate author
    // code as an expression and deliver a blank or mangled component.
    const authored = "const T = () => <p>{{ literal: 'braces' }}</p>;";
    const { container } = widget.render();
    const seen = recordFrameMessages(frame(container));

    await setProperty('code', authored, { skipResolve: true });

    await waitFor(() => expect(lastOfType(seen, 'CODE_UPDATED')).toBeDefined());
    expect(lastOfType(seen, 'CODE_UPDATED').code).toBe(authored);
    expect(store().getResolvedComponent(ID, null, MODULE_ID).properties.code).toBe(authored);

    // The runtime only skips resolution because the registration says to, in
    // both independently maintained configs. Without this the check above
    // passes on its own explicit flag and guards nothing for real authors.
    expect(frontendConfig.definition.properties.code.skipResolve).toBe(true);
    expect(serverConfig.definition.properties.code.skipResolve).toBe(true);
  });

  // ---------------------------------------------------------------- messaging

  test('[CustomComponent-MSG-001] INIT is answered with the current data and code', async () => {
    // Break this catches: replying from the first-render value instead of the
    // current ref, so a frame that loads late starts from stale data.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    await setProperty('data', dataExpr({ stage: 'later' }));
    await waitFor(() => expect(exposedData()).toEqual({ stage: 'later' }));

    const seen = recordFrameMessages(frame(container));
    await fromFrame({ message: 'INIT' });

    await waitFor(() => expect(lastOfType(seen, 'INIT_RESPONSE')).toBeDefined());
    expect(lastOfType(seen, 'INIT_RESPONSE')).toMatchObject({
      componentId: ID,
      data: { stage: 'later' },
      code: frontendConfig.definition.properties.code.value,
    });
  });

  test('[CustomComponent-MSG-002] Successive author updates rebase on the Data property', async () => {
    // Break this catches: a change to the merge base. D-01 pinned rebasing on
    // the property value, so this fails if updates ever start accumulating.
    widget.render();
    await setProperty('data', dataExpr({ name: 'Ada', status: 'Active' }));
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Ada', status: 'Active' }));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { status: 'Inactive' } });
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Ada', status: 'Inactive' }));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { name: 'Grace' } });
    // Rebased on the property value, so the first update's `status` is lost.
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Grace', status: 'Active' }));
  });

  test('[CustomComponent-MSG-003] An author update that changes nothing does not republish', async () => {
    // Break this catches: dropping the equality guard, which would post a
    // DATA_UPDATED for every no-op and drive author code into a render loop.
    const { container } = widget.render();
    await setProperty('data', dataExpr({ name: 'Ada' }));
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Ada' }));

    const seen = recordFrameMessages(frame(container));

    // Anchor the counter: a real update must post exactly one notification, so
    // the no-op assertion below cannot pass just because nothing was recorded.
    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { name: 'Grace' } });
    await waitFor(() => expect(countOfType(seen, 'DATA_UPDATED')).toBe(1));
    expect(exposedData()).toEqual({ name: 'Grace' });

    // Re-sending the same value changes nothing and posts nothing further.
    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { name: 'Grace' } });
    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { name: 'Grace' } });
    expect(countOfType(seen, 'DATA_UPDATED')).toBe(1);
    expect(exposedData()).toEqual({ name: 'Grace' });
  });

  test('[CustomComponent-MSG-004] A Data property change overrides author state', async () => {
    // Break this catches: letting author state survive a genuine property
    // change, or resetting it on a rewrite that changed nothing.
    widget.render();
    await setProperty('data', dataExpr({ name: 'Ada', status: 'Active' }));
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Ada', status: 'Active' }));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { status: 'Inactive' } });
    await waitFor(() => expect(exposedData().status).toBe('Inactive'));

    // A rewrite to the same value must NOT reset author state.
    await setProperty('data', dataExpr({ name: 'Ada', status: 'Active' }));
    await settle();
    expect(exposedData().status).toBe('Inactive');

    // A genuine change must win.
    await setProperty('data', dataExpr({ name: 'Grace', status: 'Active' }));
    await waitFor(() => expect(exposedData()).toEqual({ name: 'Grace', status: 'Active' }));
  });

  // ------------------------------------------------------------------ queries

  test('[CustomComponent-QRY-001] A named query runs and its result reaches the frame', async () => {
    // Break this catches: losing the parameters on the way to the query, or
    // failing to route the result back, which leaves the author's awaited
    // promise resolving with nothing.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    await seedQueries([
      runjs('q1', 'getTodo', 'return { echoed: parameters.id, fixed: 42 };', [{ name: 'id', defaultValue: '1' }]),
    ]);

    const seen = recordFrameMessages(frame(container));
    await runQueryFromFrame({ queryName: 'getTodo', parameters: { id: 7 }, requestId: 'rq_1' });

    const response = responseFor(seen, 'rq_1');
    expect(response).toMatchObject({ componentId: ID, requestId: 'rq_1' });
    expect(response.queryResult).toMatchObject({ status: 'ok', data: { echoed: 7, fixed: 42 } });

    // Omitting a declared parameter falls back to its declared default.
    await runQueryFromFrame({ queryName: 'getTodo', requestId: 'rq_2' });
    expect(responseFor(seen, 'rq_2').queryResult).toMatchObject({ status: 'ok', data: { echoed: '1' } });
  });

  test('[CustomComponent-QRY-002] Concurrent calls resolve against their own requestId', async () => {
    // Break this catches: dropping requestId correlation, so two in-flight
    // calls resolve with each other's results.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    await seedQueries([
      runjs('qa', 'first', 'return { who: "first" };'),
      runjs('qb', 'second', 'return { who: "second" };'),
    ]);

    const seen = recordFrameMessages(frame(container));
    deliver(
      {
        from: 'customComponent',
        componentId: ID,
        message: 'RUN_QUERY',
        queryName: 'first',
        parameters: '{}',
        requestId: 'rq_a',
      },
      frameWindowOf()
    );
    deliver(
      {
        from: 'customComponent',
        componentId: ID,
        message: 'RUN_QUERY',
        queryName: 'second',
        parameters: '{}',
        requestId: 'rq_b',
      },
      frameWindowOf()
    );
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(responsesIn(seen)).toHaveLength(2);
    expect(responseFor(seen, 'rq_a').queryResult).toMatchObject({ data: { who: 'first' } });
    expect(responseFor(seen, 'rq_b').queryResult).toMatchObject({ data: { who: 'second' } });
  });

  test('[CustomComponent-QRY-003] A failing query still answers the frame', async () => {
    // Break this catches: answering only on success, which leaves the author's
    // await pending forever and hangs their component.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    await seedQueries([runjs('qf', 'boom', 'throw new Error("kaboom");')]);

    const seen = recordFrameMessages(frame(container));
    await runQueryFromFrame({ queryName: 'boom', requestId: 'rq_f' });

    const response = responseFor(seen, 'rq_f');
    expect(response).toMatchObject({ componentId: ID, requestId: 'rq_f' });
    expect(response.queryResult).toMatchObject({ message: 'kaboom' });
  });

  test('[CustomComponent-QRY-004] An unknown query name answers the frame with no result', async () => {
    // Break this catches: a change to the no-match path. D-02 pinned answering
    // with no result, so this fails if it ever starts erroring or hanging.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    await seedQueries([runjs('q1', 'realQuery', 'return { ok: true };')]);

    const seen = recordFrameMessages(frame(container));
    await runQueryFromFrame({ queryName: 'noSuchQuery', requestId: 'rq_missing' });

    const response = responseFor(seen, 'rq_missing');
    expect(response).toMatchObject({ componentId: ID, requestId: 'rq_missing' });
    expect(response.queryResult).toBeUndefined();
  });

  test("[CustomComponent-QRY-005] Queries run in the component's own mode and module", async () => {
    // Break this catches: hardcoding the query bridge to editor mode and the
    // canvas module. Editor-only warnings then reach end users in a released
    // app, and a component inside a module cannot see that module's queries.
    seedApp({ [ID]: ccDefinition(ID, HANDLE) }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);

    const { container } = widget.session.render(
      <>
        <RenderWidget {...widgetProps(ID, 'CustomComponent', { currentMode: 'view' })} />
        <Toaster />
      </>
    );
    await waitFor(() => expect(exposedData()).toBeDefined());

    // `switchPage` warns only in the editor, so a leaked warning proves the
    // bridge ran the query under editor-mode semantics in a viewed app.
    await seedQueries([runjs('qp', 'jump', "await actions.switchPage('no-such-handle'); return { done: true };")]);
    const seen = recordFrameMessages(frame(container));
    await runQueryFromFrame({ queryName: 'jump', requestId: 'rq_mode' });

    expect(responseFor(seen, 'rq_mode')).toBeDefined();
    expect(screen.queryByText('Valid page handle is required')).toBeNull();

    // A component inside a module must resolve THAT module's queries, not the
    // canvas module's. Same query name in both namespaces, different results.
    await widget.session.store.act(async () => {
      bootModule('mod-1');
      await drain();
    });
    await seedQueries([runjs('qs', 'shared', 'return { from: "canvas" };')], MODULE_ID);
    await seedQueries([runjs('qm', 'shared', 'return { from: "module" };')], 'mod-1');

    let fromModule;
    await widget.session.store.act(async (state) => {
      fromModule = await state.eventsSlice.onEvent(
        'onTrigger',
        [],
        { queryName: 'shared', parameters: {} },
        'view',
        'mod-1'
      );
    });
    expect(fromModule).toMatchObject({ status: 'ok', data: { from: 'module' } });
  });

  // -------------------------------------------------------- isolation/lifecycle

  test('[CustomComponent-ISO-001] Messages are scoped to their own component id', async () => {
    // Break this catches: dropping the componentId guard, letting one
    // component's author code overwrite another component's data.
    const { container } = widget.render({
      extraComponents: { [ID2]: ccDefinition(ID2, HANDLE2) },
      also: [{ id: ID2, componentType: 'CustomComponent' }],
    });
    await waitFor(() => expect(exposedData(ID)).toEqual(REGISTERED_DATA));
    await waitFor(() => expect(exposedData(ID2)).toEqual(REGISTERED_DATA));
    expect(frame(container, HANDLE2)).toBeInTheDocument();

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'only mine' } }, ID);

    await waitFor(() => expect(exposedData(ID).title).toBe('only mine'));
    expect(exposedData(ID2)).toEqual(REGISTERED_DATA);
  });

  test('[CustomComponent-ISO-002] Messages without the customComponent tag are ignored', async () => {
    // Break this catches: widening the inbound filter, which would let any
    // unrelated page traffic drive the bridge. Sent from the component's own
    // frame, so only the tag check can reject them (the sender check is SEC-003).
    widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    deliver({ componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'spoofed' } }, frameWindowOf());
    deliver(
      { from: 'somethingElse', componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'x' } },
      frameWindowOf()
    );
    await settle();

    expect(exposedData()).toEqual(REGISTERED_DATA);
  });

  test('[CustomComponent-ISO-003] A malformed message does not break the bridge', async () => {
    // Break this catches: removing the try/catch, so one malformed payload
    // tears down the listener and deadens the component for the whole session.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    // From the component's own frame, so they get past the sender check.
    deliver(undefined, frameWindowOf());
    deliver('a bare string', frameWindowOf());
    await settle();
    await fromFrame({ message: 'RUN_QUERY', queryName: 'x', parameters: 'not json', requestId: 'rq_bad' });

    expect(frame(container)).toBeInTheDocument();
    expect(exposedData()).toEqual(REGISTERED_DATA);

    // A well-formed message is still handled afterwards.
    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'still working' } });
    await waitFor(() => expect(exposedData().title).toBe('still working'));
  });

  test('[CustomComponent-LIFE-001] Unmount stops listening to window messages', async () => {
    // Break this catches: leaking the window 'message' listener, so an
    // unmounted component keeps reacting to traffic meant for a live one.
    //
    // Per D-10 this does NOT assert the CLEANUP post. React detaches the
    // iframe ref during the mutation phase, before this passive effect's
    // cleanup runs, so the guarded CLEANUP branch is unreachable on unmount.
    // Confirmed dead rather than merely untested: with the component mounted,
    // `onEvent` keeps a stable identity across event registration, property
    // changes, exposed-value writes and a mode switch, so the effect never
    // re-runs and the branch has no reachable caller in either direction.
    const { container, unmount } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    const formerFrame = frameWindowOf();

    const removed = [];
    const realRemove = window.removeEventListener.bind(window);
    const removeSpy = jest.spyOn(window, 'removeEventListener').mockImplementation((type, fn, opts) => {
      removed.push(type);
      return realRemove(type, fn, opts);
    });

    await widget.session.store.act(async () => {
      unmount();
      await drain();
    });

    expect(removed).toContain('message');
    removeSpy.mockRestore();
    expect(container.querySelector('iframe')).toBeNull();

    const before = exposedData();
    deliver(
      { from: 'customComponent', componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'after' } },
      formerFrame
    );
    await settle();
    expect(exposedData()).toEqual(before);
  });

  test('[CustomComponent-LIFE-002] The listener follows a changed component identity', async () => {
    // Break this catches: pinning the listener to the first id, so a
    // re-identified component answers the wrong messages or none at all.
    widget.render({
      extraComponents: { [ID2]: ccDefinition(ID2, HANDLE2) },
      also: [{ id: ID2, componentType: 'CustomComponent' }],
    });
    await waitFor(() => expect(exposedData(ID2)).toEqual(REGISTERED_DATA));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'for two' } }, ID2);
    await waitFor(() => expect(exposedData(ID2).title).toBe('for two'));
    expect(exposedData(ID)).toEqual(REGISTERED_DATA);
  });

  test('[CustomComponent-SEC-001] The embedded frame stays same-origin for author code', async () => {
    // Break this catches: adding a sandbox restriction, which D-03 accepted as
    // out of bounds because it would break every existing custom component.
    const { container } = widget.render();

    expect(frame(container)).not.toHaveAttribute('sandbox');
    expect(frame(container)).toHaveAttribute('srcdoc');
  });

  test('[CustomComponent-SEC-003] The host acts only on messages from its own frame', async () => {
    // Break this catches: trusting the self-asserted tag and id alone, so a
    // page embedded in an IFrame widget (or any script) that knows the id can
    // overwrite the component's data and run queries under the viewer's session.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));
    await seedQueries([runjs('qs', 'secretQuery', 'return { leaked: true };')]);
    const seen = recordFrameMessages(frame(container));

    const foreignFrame = document.createElement('iframe');
    document.body.appendChild(foreignFrame);
    const strangers = [foreignFrame.contentWindow, window, null];

    for (const source of strangers) {
      await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'forged' } }, ID, source);
      await fromFrame({ message: 'INIT' }, ID, source);
      await fromFrame(
        { message: 'RUN_QUERY', queryName: 'secretQuery', parameters: '{}', requestId: 'rq_forged' },
        ID,
        source
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(exposedData()).toEqual(REGISTERED_DATA);
    expect(countOfType(seen, 'INIT_RESPONSE')).toBe(0);
    expect(responsesIn(seen)).toHaveLength(0);

    // The same messages from the component's own frame are handled once each.
    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'genuine' } });
    await waitFor(() => expect(exposedData().title).toBe('genuine'));
    await runQueryFromFrame({ queryName: 'secretQuery', requestId: 'rq_genuine' });
    expect(responsesIn(seen)).toHaveLength(1);
    expect(responseFor(seen, 'rq_genuine').queryResult).toMatchObject({ status: 'ok', data: { leaked: true } });

    foreignFrame.remove();
  });

  // ------------------------------------------------------------------ styles

  test('[CustomComponent-STY-001] Box shadow is applied and survives unrelated changes', async () => {
    // Break this catches: dropping the configured shadow, or letting the
    // universal generalStyles duplicate win over the widget's own style.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    const { container } = widget.render({ styles: { boxShadow: binding(shadow) } });
    await waitFor(() => expect(root(container)).toHaveStyle({ boxShadow: shadow }));

    await setProperty('data', dataExpr({ changed: true }));
    await waitFor(() => expect(exposedData()).toEqual({ changed: true }));
    expect(root(container)).toHaveStyle({ boxShadow: shadow });

    await setStyle('visibility', '{{false}}');
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: shadow });
  });

  test('[CustomComponent-STY-002] Visibility hides the widget without tearing down the frame', async () => {
    // Break this catches: unmounting the frame when hidden, which would reload
    // author code and discard its state every time visibility toggles.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    await fromFrame({ message: 'UPDATE_DATA', updatedObj: { title: 'author state' } });
    await waitFor(() => expect(exposedData().title).toBe('author state'));
    const original = frame(container);

    await setStyle('visibility', '{{false}}');
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(frame(container)).toBe(original);
    expect(exposedData().title).toBe('author state');

    await setStyle('visibility', '{{true}}');
    await waitFor(() => expect(root(container)).not.toHaveStyle({ display: 'none' }));
    expect(frame(container)).toBe(original);
    expect(exposedData().title).toBe('author state');
  });

  test('[CustomComponent-STY-003] Border radius is applied from the resolved style', async () => {
    // Break this catches: forwarding a falsy radius straight into the template
    // literal, which renders the malformed length "falsepx".
    const { container } = widget.render({ styles: { borderRadius: binding('{{12}}') } });
    await waitFor(() => expect(root(container)).toHaveStyle({ borderRadius: '12px' }));

    await setStyle('borderRadius', '');
    await waitFor(() => expect(root(container)).toHaveStyle({ borderRadius: '6px' }));
    expect(root(container).style.borderRadius).not.toContain('false');
  });

  test('[CustomComponent-STY-004] Border color reaches the wrapper as a custom property', async () => {
    // Break this catches: dropping the custom property the border declaration
    // consumes, which leaves the configured colour with nothing to resolve to.
    const { container } = widget.render({ styles: { borderColor: binding('rgb(0, 128, 0)') } });

    await waitFor(() =>
      expect(root(container).style.getPropertyValue('--cc-custom-component-border-color')).toBe('rgb(0, 128, 0)')
    );

    await setStyle('borderColor', '#ff0000');
    await waitFor(() =>
      expect(root(container).style.getPropertyValue('--cc-custom-component-border-color')).toBe('#ff0000')
    );
  });

  test('[CustomComponent-A11Y-001] The embedded frame is named after the component', async () => {
    // Break this catches: shipping an unnamed frame, which assistive
    // technology announces as an anonymous region indistinguishable from
    // every other custom component on the page.
    const { container } = widget.render({
      extraComponents: { [ID2]: ccDefinition(ID2, HANDLE2) },
      also: [{ id: ID2, componentType: 'CustomComponent' }],
    });

    expect(frame(container)).toHaveAccessibleName(HANDLE);
    expect(frame(container, HANDLE2)).toHaveAccessibleName(HANDLE2);
  });
});

// ------------------------------------------------------------- ListView rows

const LISTVIEW_SCENARIO = defineAppBuilderScenario({
  id: 'custom-component-in-listview',
  name: 'Custom Component rendered in every row of a Listview',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Listview rows render through AppCanvas/Container.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

describe('CustomComponent inside a Listview', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: LISTVIEW_SCENARIO });
  });

  async function settleRows() {
    await session.store.act(async () => {
      await drain();
      await drain();
    });
  }

  function renderListviewWithCustomComponent() {
    store().setVariable('rows', [{ name: 'A' }, { name: 'B' }], MODULE_ID);
    const listview = componentDefinition('lv1', 'listview1', 'Listview', {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding('150'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    });
    const cc = ccDefinition(ID, HANDLE, { data: binding('{{ { row: listItem.name } }}') });
    cc.component.parent = 'lv1';
    cc.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };

    seedApp({ lv1: listview, [ID]: cc }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
  }

  const rowData = (index) => store().getExposedValueOfComponent('lv1', MODULE_ID)?.children?.[index]?.[HANDLE]?.data;

  test('[CustomComponent-ISO-004] A ListView row frame drives only its own row', async () => {
    // Break this catches: matching messages by component id alone, which every
    // row shares, so one row's runQuery runs once per row and one row's
    // updateData is written into every row.
    renderListviewWithCustomComponent();
    await waitFor(() => expect(rowData(0)).toEqual({ row: 'A' }));
    await waitFor(() => expect(rowData(1)).toEqual({ row: 'B' }));
    await session.store.act(async () => {
      store().dataQuery.setQueries([runjs('qr', 'rowQuery', 'return { ran: true };')], MODULE_ID);
      await drain();
    });

    const frames = [...document.querySelectorAll(`iframe[data-id="${ID}"]`)];
    expect(frames).toHaveLength(2);
    const [row0, row1] = frames.map((el) => recordFrameMessages(el));

    deliver(
      {
        from: 'customComponent',
        componentId: ID,
        message: 'RUN_QUERY',
        queryName: 'rowQuery',
        parameters: '{}',
        requestId: 'rq_row0',
      },
      frames[0].contentWindow
    );
    await settleRows();
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(responsesIn(row0)).toHaveLength(1);
    expect(responseFor(row0, 'rq_row0').queryResult).toMatchObject({ status: 'ok', data: { ran: true } });
    expect(responsesIn(row1)).toHaveLength(0);

    deliver(
      { from: 'customComponent', componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'row 0 only' } },
      frames[0].contentWindow
    );
    await settleRows();

    await waitFor(() => expect(rowData(0)).toEqual({ row: 'A', title: 'row 0 only' }));
    expect(rowData(1)).toEqual({ row: 'B' });
  });
});

// ------------------------------------------------------- frame-side bridge

/**
 * The bridge script that runs inside the frame, taken from the real
 * iframe.html. Jest maps `.html` imports to a stub, so it is read from disk.
 * It is the first inline `data-required` script; the CDN tags carry a `src`
 * and the connectComponent tag is `text/babel`, so neither matches.
 */
const BRIDGE_SCRIPT = require('fs')
  .readFileSync(require('path').resolve(__dirname, '../../iframe.html'), 'utf8')
  .match(/<script data-required="true">([\s\S]*?)<\/script>/)[1];

describe('CustomComponent frame bridge', () => {
  let mounted = [];

  afterEach(() => {
    mounted.forEach((el) => el.remove());
    mounted = [];
    jest.restoreAllMocks();
  });

  /** A frame running the real bridge, plus a sibling frame playing a foreign page. */
  function mountBridge() {
    const host = document.createElement('iframe');
    host.setAttribute('data-id', ID);
    const sibling = document.createElement('iframe');
    document.body.append(host, sibling);
    mounted.push(host, sibling);

    const frameWindow = host.contentWindow;
    frameWindow.eval(BRIDGE_SCRIPT);
    frameWindow.Tooljet.cleanup();
    frameWindow.Tooljet.init();

    const props = [];
    frameWindow.Tooljet.subscribe((value) => props.push(value));
    return { frameWindow, foreign: sibling.contentWindow, props };
  }

  const send = (frameWindow, data, source) =>
    frameWindow.dispatchEvent(new frameWindow.MessageEvent('message', { data, source }));

  const authorScripts = (frameWindow) =>
    [...frameWindow.document.getElementsByTagName('script')].filter((s) => s.getAttribute('data-required') !== 'true');

  test('[CustomComponent-SEC-002] The frame acts only on messages from its host page', async () => {
    // Break this catches: trusting every window, so a page in an IFrame widget
    // reaches the frame through window.parent.frames and replaces the author's
    // data or loads its own code with the app's origin.
    const { frameWindow, foreign, props } = mountBridge();
    const initial = [...props];

    send(frameWindow, { message: 'DATA_UPDATED', data: { title: 'foreign' } }, foreign);
    send(frameWindow, { message: 'CODE_UPDATED', code: 'foreign code', data: {} }, foreign);
    send(frameWindow, { message: 'INIT_RESPONSE', code: 'foreign code', data: {} }, foreign);
    send(frameWindow, { message: 'CLEANUP', componentId: ID }, foreign);
    expect(props).toEqual(initial);
    expect(authorScripts(frameWindow)).toHaveLength(0);

    // A pending runQuery is not resolved by a foreign response.
    const postSpy = jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    let settled = null;
    frameWindow.Tooljet.runQuery('getTodo', { id: 1 }).then((result) => {
      settled = result;
    });
    const { requestId } = postSpy.mock.calls.find(([msg]) => msg.message === 'RUN_QUERY')[0];
    send(
      frameWindow,
      { message: 'RUN_QUERY_RESPONSE', componentId: ID, requestId, queryResult: { forged: 1 } },
      foreign
    );
    await Promise.resolve();
    expect(settled).toBeNull();

    // The same messages from the host page still work; the foreign CLEANUP
    // above did not tear the listener down.
    send(frameWindow, { message: 'RUN_QUERY_RESPONSE', componentId: ID, requestId, queryResult: { ok: 1 } }, window);
    await Promise.resolve();
    expect(settled).toEqual({ ok: 1 });

    send(frameWindow, { message: 'DATA_UPDATED', data: { title: 'from host' } }, window);
    expect(props[props.length - 1]).toEqual({ title: 'from host' });

    send(frameWindow, { message: 'INIT_RESPONSE', code: 'const host = 1;', data: { title: 'init' } }, window);
    expect(authorScripts(frameWindow).map((s) => s.text)).toEqual(['const host = 1;']);
    expect(props[props.length - 1]).toEqual({ title: 'init' });

    send(frameWindow, { message: 'CLEANUP', componentId: ID }, window);
    const afterCleanup = props.length;
    send(frameWindow, { message: 'DATA_UPDATED', data: { title: 'after cleanup' } }, window);
    expect(props).toHaveLength(afterCleanup);
  });

  test('[CustomComponent-SEC-004] Loading code leaves author-owned globals alone', () => {
    // Break this catches: the code loader assigning an undeclared `script`,
    // which overwrites a window.script the author owns on every code load.
    const { frameWindow } = mountBridge();
    frameWindow.script = 'author value';

    send(frameWindow, { message: 'INIT_RESPONSE', code: 'const x = 1;', data: {} }, window);

    expect(authorScripts(frameWindow)).toHaveLength(1);
    expect(frameWindow.script).toBe('author value');
  });
});
