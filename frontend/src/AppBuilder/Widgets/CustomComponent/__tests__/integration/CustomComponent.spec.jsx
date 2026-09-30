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
import { componentDefinition, seedApp } from '@/test/app-builder';
import { customComponentConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/customComponent';
import { customComponentConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/customComponent';

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

/** Posts a message exactly as the embedded frame would post it. */
async function fromFrame(payload, componentId = ID) {
  window.postMessage({ from: 'customComponent', componentId, ...payload }, '*');
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
  window.postMessage(
    {
      from: 'customComponent',
      componentId,
      message: 'RUN_QUERY',
      queryName,
      parameters: JSON.stringify(parameters),
      requestId,
    },
    '*'
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
    window.postMessage(
      {
        from: 'customComponent',
        componentId: ID,
        message: 'RUN_QUERY',
        queryName: 'first',
        parameters: '{}',
        requestId: 'rq_a',
      },
      '*'
    );
    window.postMessage(
      {
        from: 'customComponent',
        componentId: ID,
        message: 'RUN_QUERY',
        queryName: 'second',
        parameters: '{}',
        requestId: 'rq_b',
      },
      '*'
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
    // unrelated page traffic drive the bridge.
    widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    window.postMessage({ componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'spoofed' } }, '*');
    window.postMessage(
      { from: 'somethingElse', componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'x' } },
      '*'
    );
    await settle();

    expect(exposedData()).toEqual(REGISTERED_DATA);
  });

  test('[CustomComponent-ISO-003] A malformed message does not break the bridge', async () => {
    // Break this catches: removing the try/catch, so one malformed payload
    // tears down the listener and deadens the component for the whole session.
    const { container } = widget.render();
    await waitFor(() => expect(exposedData()).toEqual(REGISTERED_DATA));

    window.postMessage(undefined, '*');
    window.postMessage('a bare string', '*');
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
    window.postMessage(
      { from: 'customComponent', componentId: ID, message: 'UPDATE_DATA', updatedObj: { title: 'after' } },
      '*'
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
