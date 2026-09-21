/**
 * Form widget behaviour.
 *
 * Contract: frontend/ee/test/app-builder/widgets/Form/TESTING.md
 * Every test title starts with its approved scenario ID; the `// Break this catches:`
 * comment names the production edit its oracle is meant to catch.
 *
 * Form is the only widget whose public value is an aggregate of OTHER components, so most
 * scenarios seed body children and read the Form's exposed values rather than its DOM.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createWidgetHarness,
  binding,
  drain,
  countInvocationsOn,
  containerChild,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition, seedApp } from '@/test/app-builder';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { generateUIComponents } from '@/AppBuilder/Widgets/Form/FormUtils';
import { widgetProps, store, MODULE_ID } from '@/AppBuilder/Widgets/widgetHarness';

const ID = 'f1';
const NAME = 'form1';

const harness = createWidgetHarness({
  componentType: 'Form',
  handle: NAME,
  id: ID,
  // AppCanvas/Container throws `Expected drag drop context` without the real DndProvider.
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

const root = () => document.getElementById(ID);
const body = () => document.querySelector('.jet-form-body');
const bodyCanvas = () => document.getElementById(`canvas-${ID}`);
const header = () => document.querySelector(`[data-cy="${NAME}-header-section"]`);
const footer = () => document.querySelector(`[data-cy="${NAME}-footer-section"]`);
const fieldset = () => root()?.querySelector('fieldset');
const childNode = (name) => document.querySelector(`[data-cy="draggable-widget-${name}"]`);

/**
 * Children are seeded with the SHARED `containerChild` helper rather than a local one: Container,
 * Accordion and Form each hand-rolled the same seeder, so it now lives in widgetHarness.js where
 * every sub-container widget can use it. This thin wrapper only adapts the argument order the
 * scenarios below already read well with.
 */
const childOf = (parent, id, name, type = 'TextInput', properties = {}) =>
  containerChild(parent, id, name, type, { properties });

/**
 * The first mount of a widget inside the sub-canvas compiles the whole WidgetWrapper dependency
 * tree — measured at ~4s warm on the Container suite, enough to blow Jest's per-test timeout on a
 * cold cache. Paid once here so no scenario's waitFor is measuring module compilation.
 */
beforeAll(async () => {
  const warm = createWidgetHarness({
    componentType: 'Form',
    handle: NAME,
    id: ID,
    capabilities: { dnd: true },
    widgetHeight: 450,
    widgetWidth: 600,
  });
  warm.setup();
  warm.render({ extraComponents: { warmkid: childOf(ID, 'warmkid', 'warmtext', 'Text', { text: binding('w') }) } });
  await waitFor(() => expect(document.querySelector('[data-cy="draggable-widget-warmtext"]')).toBeTruthy(), {
    timeout: 120000,
  });
  warm.teardown();
  const sessions = globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ || [];
  while (sessions.length) await sessions.pop()();
  require('zustand').__resetAllStores?.();
}, 180000);

beforeEach(() => harness.setup());
afterEach(() => harness.teardown());

describe('Form: base rendering', () => {
  // Break this catches: reverting the D-02 fix, so a literal `false` is interpolated into the class
  // list of every Form root outside schema mode — which pollutes any CSS-class assertion and makes
  // user-authored cssClass debugging confusing.
  test('[Form-RENDER-001] a default Form renders a form element with the intended class list and body', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().tagName).toBe('FORM');
    expect([...root().classList].sort()).toEqual(['jet-container', 'jet-form-widget']);
    expect(body()).toBeTruthy();
    expect(bodyCanvas()).toBeTruthy();
  });

  // Break this catches: dropping the onSubmit preventDefault, which would let a submit inside the
  // real <form> element reload the whole app.
  test('[Form-RENDER-002] the native form element does not navigate on submit', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    const event = new Event('submit', { bubbles: true, cancelable: true });
    root().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe('Form: the header and footer slots', () => {
  // Break this catches: inverting the showHeader guard, which would strip the title area from every
  // form configured to have one.
  test('[Form-SLOT-001] showHeader adds and removes the header slot', async () => {
    harness.render({
      properties: { showHeader: binding('{{false}}') },
      extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'Text', { text: binding('inside') }) },
    });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(header()).toBeNull();

    harness.setComponentProperty(ID, 'showHeader', '{{true}}', 'properties');

    await waitFor(() => expect(header()).toBeTruthy());
    expect(childNode('bodytext')).toBeTruthy();
  });

  // Break this catches: tying the footer to the header's guard, so a form configured with only a
  // footer loses its submit button.
  test('[Form-SLOT-002] showFooter adds and removes the footer slot independently', async () => {
    harness.render({ properties: { showHeader: binding('{{false}}'), showFooter: binding('{{true}}') } });
    await waitFor(() => expect(footer()).toBeTruthy());
    expect(header()).toBeNull();

    harness.setComponentProperty(ID, 'showFooter', '{{false}}', 'properties');

    await waitFor(() => expect(footer()).toBeNull());
  });

  // Break this catches: reintroducing a computed pixel height for the body wrapper — the D-01
  // deletion. Any form whose content overflows would grow past its own height and lose its scroll.
  test('[Form-SLOT-007] the body wrapper height is 100%, not a computed pixel value', async () => {
    harness.render({ properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') } });
    await waitFor(() => expect(body()).toBeTruthy());
    expect(body().style.height).toBe('100%');

    harness.render({ properties: { showHeader: binding('{{false}}'), showFooter: binding('{{false}}') } });
    await waitFor(() => expect(body()).toBeTruthy());
    expect(body().style.height).toBe('100%');
  });
});

describe('Form: the three shared states', () => {
  // Break this catches: removing the disabled fieldset, which would leave every field in a disabled
  // form fully interactive.
  test('[Form-STATE-002] a disabled Form disables its fields through a native fieldset', async () => {
    harness.render({
      properties: { disabledState: binding('{{true}}') },
      extraComponents: { kid: childOf(ID, 'kid', 'input1') },
    });
    await waitFor(() => expect(fieldset()).toBeTruthy());

    expect(fieldset().disabled).toBe(true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await waitFor(() => expect(fieldset().disabled).toBe(false));
  });

  // Break this catches: rendering the spinner alongside the fields instead of instead of them, or
  // leaving the slots mounted while loading.
  test('[Form-STATE-003] loading replaces the body contents and removes both slots', async () => {
    harness.render({
      properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') },
      extraComponents: { kid: childOf(ID, 'kid', 'bodytext', 'Text', { text: binding('inside') }) },
    });
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(header()).toBeTruthy();

    harness.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');

    await waitFor(() => expect(childNode('bodytext')).toBeNull());
    expect(header()).toBeNull();
    expect(footer()).toBeNull();
    expect(body()).toBeTruthy();
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));

    harness.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(childNode('bodytext')).toBeTruthy());
    expect(header()).toBeTruthy();
  });
});

describe('Form: reset and clear', () => {
  const input = () => document.getElementById('component-kid');
  const withInput = () => ({ kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('preset') }) });

  // Break this catches: a reset that no longer remounts the fields, so a form keeps whatever the
  // user typed after submitting it.
  test('[Form-RESET-001] resetForm restores the fields to their configured defaults', async () => {
    harness.render({ extraComponents: withInput() });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('preset');

    await userEvent.clear(input());
    await userEvent.type(input(), 'typed');
    await waitFor(() => expect(input().value).toBe('typed'));

    await harness.act('resetForm');

    await waitFor(() => expect(input().value).toBe('preset'));
  });

  // Break this catches: reverting the D-12 fix, so a reset remounts the whole Form and silently
  // discards a CSA-set disabled/visibility/loading state. With resetOnSubmit on by default that
  // happens on every successful submit — an app that disables its form while processing gets it
  // re-enabled underneath.
  test('[Form-RESET-002] a reset leaves the Form own visibility, disabled and loading state alone', async () => {
    harness.render({ extraComponents: withInput() });
    await waitFor(() => expect(input()).toBeTruthy());

    await harness.act('setDisable', true);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    await harness.act('resetForm');

    // The fields reset...
    await waitFor(() => expect(input().value).toBe('preset'));
    // ...but the Form's own chrome state survives.
    expect(harness.exposed().isDisabled).toBe(true);
    expect(fieldset().disabled).toBe(true);
  });

  // Break this catches: keying something narrower than the provider, so the reset works in the
  // normal sub-canvas path but silently does nothing in JSON-schema mode (or vice versa).
  test('[Form-RESET-003] a reset still remounts the fields in the normal path', async () => {
    harness.render({ extraComponents: withInput() });
    await waitFor(() => expect(input()).toBeTruthy());

    await userEvent.clear(input());
    await userEvent.type(input(), 'changed');
    await waitFor(() => expect(input().value).toBe('changed'));

    await harness.act('resetForm');
    await waitFor(() => expect(input().value).toBe('preset'));

    // A second reset works the same way — the key increments rather than toggling.
    await userEvent.clear(input());
    await userEvent.type(input(), 'again');
    await waitFor(() => expect(input().value).toBe('again'));
    await harness.act('resetForm');
    await waitFor(() => expect(input().value).toBe('preset'));
  });

  // Break this catches: clearForm reusing the reset path, which would restore defaults instead of
  // clearing — the opposite of what an app asking to clear a form wants.
  test('[Form-CLEAR-002] clearForm empties a field where resetForm restores its default', async () => {
    harness.render({ extraComponents: withInput() });
    await waitFor(() => expect(input()).toBeTruthy());
    expect(input().value).toBe('preset');

    await harness.act('clearForm');
    await waitFor(() => expect(input().value).toBe(''));

    await harness.act('resetForm');
    await waitFor(() => expect(input().value).toBe('preset'));
  });
});

describe('Form: the aggregation', () => {
  const twoInputs = () => ({
    kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('alpha') }),
    kid2: childOf(ID, 'kid2', 'input2', 'TextInput', { value: binding('beta') }),
  });

  // Break this catches: keying the aggregation by component id instead of name, which would change
  // every {{components.form1.data.<name>}} binding in every app.
  test('[Form-DATA-001] data aggregates every body child, keyed by name', async () => {
    harness.render({ extraComponents: twoInputs() });
    await waitFor(() => expect(Object.keys(harness.exposed().data ?? {})).toHaveLength(2));

    const data = harness.exposed().data;
    expect(Object.keys(data).sort()).toEqual(['input1', 'input2']);
    expect(data.input1.value).toBe('alpha');
    expect(data.input1.id).toBe('kid');
    // `data` is the function-stripped shape.
    expect(typeof data.input1.setText).not.toBe('function');
  });

  // Break this catches: changing which exposed key formData reads, or keying it by id. An app
  // posting {{components.form1.formData}} to an API would silently send the wrong payload.
  test('[Form-DATA-002] formData holds each child value under its component name', async () => {
    harness.render({ extraComponents: twoInputs() });
    await waitFor(() => expect(Object.keys(harness.exposed().formData ?? {})).toHaveLength(2));

    expect(harness.exposed().formData).toEqual({ input1: 'alpha', input2: 'beta' });
  });

  test('[Form-DATA-002] a child exposing no value key is absent from formData', async () => {
    harness.render({
      extraComponents: {
        kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('alpha') }),
        label: childOf(ID, 'label', 'text1', 'Text', { text: binding('just a label') }),
      },
    });
    await waitFor(() => expect(harness.exposed().formData?.input1).toBe('alpha'));

    // The Text child has no value/values/file/selectedDateRange, so it never reaches formData...
    expect(harness.exposed().formData).toEqual({ input1: 'alpha' });
    // ...but it is still part of `data`.
    expect(Object.keys(harness.exposed().data).sort()).toEqual(['input1', 'text1']);
  });

  // Break this catches: stripping functions from `children` as well as `data`, which would break
  // every app calling a child's action through the parent form.
  test('[Form-DATA-003] children keeps callable child actions where data strips them', async () => {
    harness.render({ extraComponents: twoInputs() });
    await waitFor(() => expect(harness.exposed().children?.input1).toBeTruthy());

    expect(typeof harness.exposed().children.input1.setText).toBe('function');
    expect(typeof harness.exposed().data.input1.setText).not.toBe('function');
  });

  // Break this catches: treating a child that publishes no validity as invalid, which would make
  // any form containing a Text label permanently unsubmittable.
  test('[Form-DATA-004] isValid is the AND of every child, and an empty Form is valid', async () => {
    harness.render();
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    harness.render({
      extraComponents: {
        kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('alpha') }),
        label: childOf(ID, 'label', 'text1', 'Text', { text: binding('label') }),
      },
    });
    await waitFor(() => expect(harness.exposed().data?.input1).toBeTruthy());
    expect(harness.exposed().isValid).toBe(true);
  });

  test('[Form-DATA-004] one invalid child makes the whole Form invalid', async () => {
    harness.render({
      extraComponents: {
        kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('') }),
      },
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(harness.exposed().data?.input1).toBeTruthy());

    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
  });

  // Break this catches: aggregating across the slot mapping keys as well as the body, which would
  // put a header title into the submitted payload.
  test('[Form-DATA-005] slot children are chrome, not fields', async () => {
    harness.render({
      properties: { showHeader: binding('{{true}}') },
      extraComponents: {
        kid: childOf(ID, 'kid', 'bodyinput', 'TextInput', { value: binding('in-body') }),
        head: childOf(`${ID}-header`, 'head', 'headerinput', 'TextInput', { value: binding('in-header') }),
      },
    });
    await waitFor(() => expect(harness.exposed().formData?.bodyinput).toBe('in-body'));
    await waitFor(() => expect(document.getElementById('component-head')).toBeTruthy());

    // The header input renders, but is not a field.
    expect(harness.exposed().formData).toEqual({ bodyinput: 'in-body' });
    expect(Object.keys(harness.exposed().data)).toEqual(['bodyinput']);
    expect(Object.keys(harness.exposed().children)).toEqual(['bodyinput']);
  });
});

describe('Form: submission', () => {
  const input = () => document.getElementById('component-kid');
  const validChild = () => ({ kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('preset') }) });
  const submits = () => harness.variables()?.submits ?? 0;
  const invalids = () => harness.variables()?.invalids ?? 0;
  const bothEvents = [
    ...countInvocationsOn(ID, 'onSubmit', { key: 'submits' }),
    ...countInvocationsOn(ID, 'onInvalid', { key: 'invalids' }),
  ];
  const dispatchSubmit = async (buttonComponentId, buttonModuleId = 'canvas') => {
    await harness.session.store.act(async () => {
      document.dispatchEvent(new CustomEvent('submitForm', { detail: { buttonComponentId, buttonModuleId } }));
    });
    await drain();
  };

  // Break this catches: firing onSubmit from both the CSA and an effect, which would double every
  // insert an app performs on submit.
  test('[Form-SUBMIT-001] submitForm fires onSubmit exactly once when the form is valid', async () => {
    harness.render({ extraComponents: validChild(), events: bothEvents });
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await harness.act('submitForm');

    await waitFor(() => expect(submits()).toBe(1));
    expect(invalids()).toBe(0);
  });

  // Break this catches: inverting the validateOnSubmit gate, so an invalid form submits anyway —
  // or a valid one never can.
  test('[Form-SUBMIT-002] an invalid submit fires onInvalid and not onSubmit', async () => {
    harness.render({
      extraComponents: { kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('') }) },
      events: bothEvents,
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('submitForm');

    await waitFor(() => expect(invalids()).toBe(1));
    expect(submits()).toBe(0);
  });

  test('[Form-SUBMIT-002] with validateOnSubmit off the same invalid form submits', async () => {
    harness.render({
      properties: { validateOnSubmit: binding('{{false}}') },
      extraComponents: { kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('') }) },
      events: bothEvents,
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('submitForm');

    await waitFor(() => expect(submits()).toBe(1));
    expect(invalids()).toBe(0);
  });

  // Break this catches: resetting before the event resolves, or resetting regardless of the flag.
  // The timing of the reset is deliberately not asserted (D-10).
  test('[Form-SUBMIT-003] a successful submit resets the fields when resetOnSubmit is on', async () => {
    harness.render({ extraComponents: validChild(), events: bothEvents });
    await waitFor(() => expect(input()).toBeTruthy());
    await userEvent.clear(input());
    await userEvent.type(input(), 'typed');
    await waitFor(() => expect(input().value).toBe('typed'));

    await harness.act('submitForm');

    await waitFor(() => expect(input().value).toBe('preset'));
    expect(submits()).toBe(1);
  });

  test('[Form-SUBMIT-003] with resetOnSubmit off the fields keep their values', async () => {
    harness.render({
      properties: { resetOnSubmit: binding('{{false}}') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(input()).toBeTruthy());
    await userEvent.clear(input());
    await userEvent.type(input(), 'typed');

    await harness.act('submitForm');
    await waitFor(() => expect(submits()).toBe(1));
    await drain();

    expect(input().value).toBe('typed');
  });

  // Break this catches: the button path diverging from the CSA path in outcome rather than only in
  // timing — a form that submits but never resets, or resets but never fires.
  test('[Form-SUBMIT-004] the submit button path reaches the same outcome as the CSA', async () => {
    harness.render({
      properties: { buttonToSubmit: binding('btn1') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(input()).toBeTruthy());
    await userEvent.clear(input());
    await userEvent.type(input(), 'typed');

    await dispatchSubmit('btn1');

    await waitFor(() => expect(submits()).toBe(1));
    await waitFor(() => expect(input().value).toBe('preset'));
  });

  // Break this catches: adding a disabled check to submitForm, which would silently stop every app
  // that disables its form while processing and submits it from a query.
  test('[Form-SUBMIT-005] submitForm still submits while the Form is disabled', async () => {
    harness.render({
      properties: { disabledState: binding('{{true}}') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(fieldset()?.disabled).toBe(true));

    await harness.act('submitForm');

    await waitFor(() => expect(submits()).toBe(1));
    // The user is still blocked; only the app's own automation gets through.
    expect(fieldset().disabled).toBe(true);
  });

  // Break this catches: submitting on any button's event, so an unrelated button elsewhere on the
  // page silently submits the form.
  test('[Form-BTN-001] only the configured button submits the form', async () => {
    harness.render({
      properties: { buttonToSubmit: binding('btn1') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await dispatchSubmit('some-other-button');
    expect(submits()).toBe(0);

    await dispatchSubmit('btn1');
    await waitFor(() => expect(submits()).toBe(1));
  });

  // Break this catches: dropping the module comparison, so a Form inside a module submits when a
  // same-named button fires in the host app.
  test('[Form-BTN-001] an event from another module does not submit', async () => {
    harness.render({
      properties: { buttonToSubmit: binding('btn1') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await dispatchSubmit('btn1', 'some-other-module');

    expect(submits()).toBe(0);
  });

  // Break this catches: leaking the document listener, so an unmounted Form keeps responding to
  // submit events for the rest of the session — a stale Form firing queries after its page is gone.
  //
  // The Form is unmounted by re-rendering the tree WITHOUT it, rather than tearing the session
  // down: the store has to survive so the invocation counter is still readable afterwards.
  test('[Form-BTN-003] the document listener is removed when the Form unmounts', async () => {
    harness.render({
      properties: { buttonToSubmit: binding('btn1') },
      extraComponents: validChild(),
      events: bothEvents,
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    // The wiring works while mounted.
    await dispatchSubmit('btn1');
    await waitFor(() => expect(submits()).toBe(1));

    // Unmount the Form, keeping the session and its store alive.
    harness.session.render(<></>);
    await waitFor(() => expect(root()).toBeNull());

    await dispatchSubmit('btn1');

    // The unmounted Form must not have responded.
    expect(submits()).toBe(1);
  });
});

describe('Form: slot geometry and chrome', () => {
  const headerSlot = () => header()?.querySelector('.resizable-slot');
  const footerSlot = () => footer()?.querySelector('.resizable-slot');
  const bothSlots = { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') };

  // Break this catches: one slot's height driving the other, so resizing the header silently
  // resizes the footer too.
  test('[Form-SLOT-003] headerHeight and footerHeight drive their own slots', async () => {
    harness.render({ properties: { ...bothSlots, headerHeight: binding('{{120}}') } });
    await waitFor(() => expect(headerSlot()).toBeTruthy());

    expect(headerSlot().style.height).toBe('120px');
    // Measured: the registered definition ships both heights at 60. The component's own `= 80`
    // destructure fallback is unreachable for a real Form, because the definition always supplies
    // the key — the same shape as Container's headerHeight.
    expect(footerSlot().style.height).toBe('60px');
  });

  // Break this catches: dropping a slot from the body-height subtraction, so the fields area
  // overlaps the header or footer.
  test('[Form-SLOT-004] the body height subtracts whichever slots are shown', async () => {
    // RenderWidget passes height = widgetHeight - 4 = 446. getBodyHeight subtracts each SHOWN slot
    // and its padding, rounds up to a multiple of ten, subtracts 20 and floors at 40
    // (FormUtils.js:537-554). Measured: the registered definition ships BOTH slots on at height 60,
    // so the defaults case is the both-slots case. Hand-derived:
    //   neither slot -> ceil(446/10)*10 - 20                     = 430
    //   header only  -> 446 - 60 - 10 = 376 -> ceil 380 - 20     = 360
    //   both slots   -> 376 - 60 - 14 = 302 -> ceil 310 - 20     = 290
    const canvasHeightAttr = () => bodyCanvas()?.getAttribute('canvas-height');

    harness.render({ properties: { showHeader: binding('{{false}}'), showFooter: binding('{{false}}') } });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    expect(canvasHeightAttr()).toBe('430');

    harness.render({ properties: { showHeader: binding('{{true}}'), showFooter: binding('{{false}}') } });
    await waitFor(() => expect(header()).toBeTruthy());
    expect(canvasHeightAttr()).toBe('360');

    harness.render({ properties: bothSlots });
    await waitFor(() => expect(footer()).toBeTruthy());
    expect(canvasHeightAttr()).toBe('290');
  });

  // Break this catches: computing each slot's ceiling from its OWN height, which would let the two
  // slots together exceed the form.
  test('[Form-SLOT-005] each slot max height is derived from the other slot', async () => {
    harness.render({ properties: { ...bothSlots, headerHeight: binding('{{120}}') } });
    await waitFor(() => expect(header()).toBeTruthy());

    // header max = height(446) - footerHeight(60, the registered default) - 110 = 276
    expect(header().style.maxHeight).toBe('276px');
    // footer max = height(446) - headerHeight(120) - 110 = 216
    expect(footer().style.maxHeight).toBe('216px');
  });

  // Break this catches: rendering the resizers in the Viewer, letting an end user drag chrome they
  // are only meant to look at.
  test('[Form-SLOT-006] the slot resize handles are editor-only', async () => {
    harness.render({ properties: bothSlots, currentMode: 'edit' });
    await waitFor(() => expect(header()).toBeTruthy());
    expect(header().querySelector('.resize-handle')).toBeTruthy();
    expect(footer().querySelector('.resize-handle')).toBeTruthy();

    harness.render({ properties: bothSlots, currentMode: 'view' });
    await waitFor(() => expect(header()).toBeTruthy());
    expect(header().querySelector('.resize-handle')).toBeNull();
    expect(footer().querySelector('.resize-handle')).toBeNull();
  });
});

describe('Form: visibility and CSA precedence', () => {
  // Break this catches: "fixing" the shared expose hook's `visibleState || true` seed without
  // realising every widget using it changes first-paint behaviour. This pins the CURRENT behaviour,
  // characterized per D-09: a Form authored hidden is visible for one commit.
  //
  // The flash is only observable from a sibling layout effect: layout effects run after the commit
  // that paints the Form, and before the passive effect that corrects the visibility.
  test('[Form-STATE-001] a hidden Form is visible on its first paint, then hidden', async () => {
    const seen = [];
    const Probe = () => {
      React.useLayoutEffect(() => {
        seen.push(document.getElementById(ID)?.style.display);
      }, []);
      return null;
    };

    // Seeded and mounted by hand rather than through harness.render(), because the probe has to be
    // in the SAME initial render as the Form: layout effects run after the commit that paints it,
    // and before the passive effect that corrects the visibility. Re-rendering afterwards would
    // only ever observe the corrected state.
    seedApp(
      { [ID]: componentDefinition(ID, NAME, 'Form', { visibility: binding('{{false}}') }) },
      {
        moduleId: MODULE_ID,
      }
    );
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);
    harness.session.render(
      <>
        <RenderWidget {...widgetProps(ID, 'Form', { widgetHeight: 450, widgetWidth: 600 })} />
        <Probe />
      </>
    );

    await waitFor(() => expect(root()).toBeTruthy());
    // The first committed paint was visible...
    expect(seen[0]).toBe('flex');
    // ...and the correcting effect has since hidden it.
    await waitFor(() => expect(root().style.display).toBe('none'));
    expect(harness.exposed().isVisible).toBe(false);
  });

  // Break this catches: the property effects re-running on every resolution, so an unrelated
  // re-render silently undoes a setDisable an app just performed.
  test('[Form-STATE-004] a CSA-set state survives a no-op property rewrite but yields to a real change', async () => {
    harness.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));

    await harness.act('setDisable', false);
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(false));

    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await drain();
    expect(harness.exposed().isDisabled).toBe(false);

    harness.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    await drain();
    harness.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
  });
});

describe('Form: clear', () => {
  // Break this catches: clearForm no longer raising the signal children subscribe to, so an app
  // calling it silently does nothing.
  test('[Form-CLEAR-001] clearForm clears the fields through the child signal', async () => {
    harness.render({
      extraComponents: { kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('preset') }) },
    });
    const input = () => document.getElementById('component-kid');
    await waitFor(() => expect(input()?.value).toBe('preset'));

    await harness.act('clearForm');

    await waitFor(() => expect(input().value).toBe(''));
  });
});

describe('Form: isolation', () => {
  // Break this catches: aggregating from a shared key rather than each Form's own children mapping,
  // which would merge two forms' payloads.
  test('[Form-ISO-001] two Forms aggregate separately', async () => {
    const second = componentDefinition('f2', 'form2', 'Form');
    harness.render({
      extraComponents: {
        f2: second,
        kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('first') }),
        kid2: childOf('f2', 'kid2', 'input2', 'TextInput', { value: binding('second') }),
      },
      also: [{ id: 'f2', componentType: 'Form' }],
    });

    await waitFor(() => expect(harness.exposed(ID).formData?.input1).toBe('first'));
    await waitFor(() => expect(harness.exposed('f2').formData?.input2).toBe('second'));

    expect(harness.exposed(ID).formData).toEqual({ input1: 'first' });
    expect(harness.exposed('f2').formData).toEqual({ input2: 'second' });
  });

  // Break this catches: dropping the button-id comparison, so one Form's submit button submits
  // every Form on the page.
  test('[Form-BTN-002] a submit event reaches only the Form that owns that button', async () => {
    const second = componentDefinition('f2', 'form2', 'Form', { buttonToSubmit: binding('btn2') });
    harness.render({
      properties: { buttonToSubmit: binding('btn1') },
      extraComponents: { f2: second },
      also: [{ id: 'f2', componentType: 'Form' }],
      // countInvocationsOn derives its row id from the eventId alone, so two onSubmit rows would
      // collide on `evt-onSubmit`. Built by hand here to give each row a distinct id.
      events: [
        {
          id: 'evt-onSubmit-f1',
          index: 0,
          sourceId: ID,
          name: 'evt-onSubmit-f1',
          event: {
            eventId: 'onSubmit',
            actionId: 'set-custom-variable',
            key: 'first',
            value: '{{(variables.first ?? 0) + 1}}',
          },
          target: 'component',
        },
        {
          id: 'evt-onSubmit-f2',
          index: 0,
          sourceId: 'f2',
          name: 'evt-onSubmit-f2',
          event: {
            eventId: 'onSubmit',
            actionId: 'set-custom-variable',
            key: 'second',
            value: '{{(variables.second ?? 0) + 1}}',
          },
          target: 'component',
        },
      ],
    });
    await waitFor(() => expect(document.getElementById('f2')).toBeTruthy());

    await harness.session.store.act(async () => {
      document.dispatchEvent(
        new CustomEvent('submitForm', { detail: { buttonComponentId: 'btn1', buttonModuleId: 'canvas' } })
      );
    });
    await drain();

    await waitFor(() => expect(harness.variables()?.first).toBe(1));
    expect(harness.variables()?.second ?? 0).toBe(0);
  });
});

describe('Form: styles', () => {
  // Break this catches: dropping the dark-mode sentinel, leaving a white form glaring on a dark
  // canvas for every app that kept the literal default.
  test('[Form-STYLE-001] the body background honours the configured colour and its dark-mode sentinel', async () => {
    harness.render({ styles: { backgroundColor: binding('rgb(1, 2, 3)') } });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');

    harness.render({ styles: { backgroundColor: binding('#fff') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(35, 46, 60)'));

    harness.render({ styles: { backgroundColor: binding('rgb(9, 9, 9)') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(9, 9, 9)'));
  });

  // Break this catches: unifying the slot sentinel with the body's. They are deliberately
  // different colours, so a shared constant would visibly change the chrome in dark mode.
  test('[Form-STYLE-002] the slot backgrounds use a different dark-mode replacement from the body', async () => {
    harness.render({
      properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') },
      styles: {
        backgroundColor: binding('#fff'),
        headerBackgroundColor: binding('#fff'),
        footerBackgroundColor: binding('#fff'),
      },
      darkMode: true,
    });
    await waitFor(() => expect(header()).toBeTruthy());

    // Body and slots take DIFFERENT replacements.
    expect(root().style.backgroundColor).toBe('rgb(35, 46, 60)');
    expect(header().style.backgroundColor).toBe('rgb(31, 40, 55)');
    expect(footer().style.backgroundColor).toBe('rgb(31, 40, 55)');
  });

  // Break this catches: publishing the dividers under the container widget's property names, which
  // the form stylesheet does not read — the dividers would silently fall back to the theme token.
  test('[Form-STYLE-003] the divider colours are published as form-specific custom properties', async () => {
    harness.render({
      styles: { headerDividerColor: binding('rgb(7, 7, 7)'), footerDividerColor: binding('rgb(8, 8, 8)') },
    });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().style.getPropertyValue('--cc-form-header-divider-color')).toBe('rgb(7, 7, 7)');
    expect(root().style.getPropertyValue('--cc-form-footer-divider-color')).toBe('rgb(8, 8, 8)');
  });

  // Break this catches: deriving the scrollbar colour from the AUTHORED background rather than the
  // resolved one, so a dark-mode form gets a scrollbar tinted for its light-mode colour.
  test('[Form-STYLE-004] the scrollbar colour is derived from the resolved background', async () => {
    harness.render({ styles: { backgroundColor: binding('#fff') } });
    await waitFor(() => expect(root()).toBeTruthy());
    const light = root().style.getPropertyValue('--cc-form-scroll-bar-color');

    harness.render({ styles: { backgroundColor: binding('#fff') }, darkMode: true });
    await waitFor(() => expect(root().style.backgroundColor).toBe('rgb(35, 46, 60)'));
    const dark = root().style.getPropertyValue('--cc-form-scroll-bar-color');

    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();
    // The same authored colour yields a different scrollbar tint once the sentinel has applied.
    expect(dark).not.toBe(light);
  });

  // Break this catches: dropping the border, or registering a styles.boxShadow on Form and thereby
  // shadowing the UNIVERSAL generalStyles.boxShadow that is live for this widget.
  test('[Form-STYLE-005] border colour and the universal box shadow reach the root', async () => {
    harness.render({
      styles: { borderColor: binding('rgb(8, 8, 8)'), boxShadow: binding('0px 2px 4px 0px rgba(0, 0, 0, 0.5)') },
    });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().style.border).toBe('1px solid rgb(8, 8, 8)');
    expect(root().style.boxShadow).toBe('0px 2px 4px 0px rgba(0, 0, 0, 0.5)');
  });

  // Break this catches: dropping the clip path, which is what stops children painting over the
  // form's rounded corners, or failing to carry the radius onto the slot corners.
  test('[Form-STYLE-006] border radius reaches the root, its clip path and both slot corners', async () => {
    harness.render({
      properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') },
      styles: { borderRadius: binding('12') },
    });
    await waitFor(() => expect(footer()).toBeTruthy());

    expect(root().style.borderRadius).toBe('12px');
    expect(root().style.clipPath).toBe('inset(0 round 12px)');
    expect(header().style.borderTopLeftRadius).toBe('12px');
    expect(footer().style.borderBottomRightRadius).toBe('12px');
  });
});

describe('Form: dynamic height', () => {
  const tempHeight = () => harness.session.store.read((st) => st.temporaryLayouts?.[ID]?.height);
  const settle = async () => {
    await drain();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await drain();
  };
  afterEach(settle);

  // Break this catches: dropping the currentMode gate, which would resize forms under a builder
  // while they are laying out a page.
  test('[Form-DYN-001] dynamic height is gated to the Viewer', async () => {
    harness.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().style.height).toBe('446px');

    harness.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' });
    await waitFor(() => expect(root().style.height).toBe('100%'));
  });

  // Break this catches: dropping the slots from the reflow trigger, so toggling a header leaves the
  // form's computed height one change behind and its siblings overlapping.
  test('[Form-DYN-002] the reflow trigger includes the slots', async () => {
    const kid = componentDefinition('kid', 'bodytext', 'Text', { text: binding('x') });
    kid.component.parent = ID;
    kid.layouts = { desktop: { top: 100, left: 0, width: 10, height: 60 } };

    harness.render({
      properties: { dynamicHeight: binding('{{true}}'), showHeader: binding('{{true}}') },
      currentMode: 'view',
      extraComponents: { kid },
    });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    await settle();
    const withHeader = tempHeight();
    expect(withHeader).toBeGreaterThan(0);

    harness.setComponentProperty(ID, 'showHeader', '{{false}}', 'properties');
    await settle();

    expect(tempHeight()).toBeLessThan(withHeader);
  });
});

describe('Form: JSON schema mode', () => {
  const schema = {
    title: 'Details',
    properties: {
      name: { type: 'textinput', label: 'Name' },
      age: { type: 'number', label: 'Age' },
    },
    submitButton: { value: 'Send' },
  };

  // Break this catches: rendering the sub-canvas in schema mode, so dragged children and generated
  // fields both appear, or leaving `children` populated when the docs say it is emptied.
  test('[Form-SCHEMA-002] JSON-schema mode swaps the render path', async () => {
    harness.render({
      properties: {
        generateFormFrom: binding('jsonSchema'),
        newJsonSchema: binding(`{{${JSON.stringify(schema)}}}`),
      },
    });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().classList.contains('jet-container-json-form')).toBe(true);
    // No sub-canvas at all in schema mode.
    expect(bodyCanvas()).toBeNull();
    await waitFor(() => expect(harness.exposed().children).toEqual([]));
  });

  // Break this catches: honouring only the new schema property, which would blank every form saved
  // before the rename.
  test('[Form-SCHEMA-003] a saved app using the deprecated advanced schema still renders', async () => {
    harness.render({
      properties: {
        advanced: binding('{{true}}'),
        JSONSchema: binding(`{{${JSON.stringify(schema)}}}`),
      },
    });
    await waitFor(() => expect(root()).toBeTruthy());

    expect(root().classList.contains('jet-container-json-form')).toBe(true);
    expect(bodyCanvas()).toBeNull();
  });
});

describe('Form: which children it accepts', () => {
  const canAdd = (parentId, widget) =>
    harness.session.store.read((st) => st.canAddToParent(parentId, widget, 'canvas'));

  // Break this catches: emptying the Form restriction list. It also PINS the disagreement with the
  // published docs (D-05): Container and ListView are documented as refused but are accepted here.
  test('[Form-DROP-001] a Form refuses the enforced child list, which differs from the documented one', async () => {
    harness.render();
    await waitFor(() => expect(root()).toBeTruthy());

    // Enforced by the config.
    for (const widget of ['Calendar', 'Kanban', 'Form', 'Tabs', 'Modal', 'Accordion']) {
      expect(canAdd(ID, widget)).toBe(false);
    }
    // Documented as refused, but ACCEPTED in the product today.
    expect(canAdd(ID, 'Container')).not.toBe(false);
    expect(canAdd(ID, 'Listview')).not.toBe(false);
    // An ordinary field is welcome.
    expect(canAdd(ID, 'TextInput')).not.toBe(false);
  });
});

describe('Form: nested in a Listview row', () => {
  // Break this catches: the Form aggregating from the flat exposed values rather than indexing by
  // its own row, so every row's form would report row 0's data.
  test('[Form-NEST-001] a Form inside a Listview row aggregates only its own row', async () => {
    const listview = createWidgetHarness({
      componentType: 'Listview',
      handle: 'listview1',
      id: 'lv1',
      capabilities: { dnd: true },
      widgetHeight: 600,
      widgetWidth: 600,
    });
    listview.setup();
    try {
      const nested = componentDefinition(ID, NAME, 'Form');
      nested.component.parent = 'lv1';
      const rowChild = componentDefinition('kid', 'rowinput', 'TextInput', { value: binding('{{listItem.label}}') });
      rowChild.component.parent = ID;

      listview.render({
        properties: { data: binding('{{[{"label":"one"},{"label":"two"}]}}'), rowHeight: binding('{{300}}') },
        extraComponents: { [ID]: nested, kid: rowChild },
      });

      await waitFor(() => expect(document.querySelectorAll('.jet-form-widget')).toHaveLength(2));

      const exposed = listview.session.store.read((st) => st.getExposedValueOfComponent(ID, 'canvas'));
      expect(Array.isArray(exposed)).toBe(true);
      expect(exposed).toHaveLength(2);
      // Each row's Form sees only its own row's field value.
      expect(exposed[0].formData).toEqual({ rowinput: 'one' });
      expect(exposed[1].formData).toEqual({ rowinput: 'two' });
    } finally {
      listview.teardown();
    }
  });
});

describe('Form: the memo comparator', () => {
  // Break this catches: tightening the custom React.memo comparator so it also swallows the
  // transition INTO or OUT OF schema mode. Today the separate `isJsonSchemaInGenerateFormFrom`
  // store subscription re-renders the Form regardless of the memo, which is what keeps both
  // transitions working — characterized per D-07, not blessed as intent.
  //
  // Measured: the skip ITSELF is not observable at this seam. A React.Profiler around RenderWidget
  // records commits for a non-schema change as well, because RenderWidget re-renders even when the
  // memoised Form child does not. Only the mode transitions are assertable here.
  test('[Form-MEMO-001] both schema-mode transitions survive the memo comparator', async () => {
    harness.render({ properties: { generateFormFrom: binding('rawJson') } });
    await waitFor(() => expect(bodyCanvas()).toBeTruthy());
    expect(root().classList.contains('jet-container-json-form')).toBe(false);

    // A non-schema change leaves the render path exactly as it was.
    harness.setComponentProperty(ID, 'generateFormFrom', 'query1', 'properties');
    await drain();
    expect(root().classList.contains('jet-container-json-form')).toBe(false);
    expect(bodyCanvas()).toBeTruthy();

    // Entering schema mode still re-renders, through the separate store subscription.
    harness.setComponentProperty(ID, 'generateFormFrom', 'jsonSchema', 'properties');
    await waitFor(() => expect(root().classList.contains('jet-container-json-form')).toBe(true));
    expect(bodyCanvas()).toBeNull();

    // And leaving it again does too, which is the direction the memo's exception targets.
    harness.setComponentProperty(ID, 'generateFormFrom', 'rawJson', 'properties');
    await waitFor(() => expect(root().classList.contains('jet-container-json-form')).toBe(false));
    expect(bodyCanvas()).toBeTruthy();
  });
});

describe('Form: the aggregation over time', () => {
  const input = () => document.getElementById('component-kid');
  const err = () => document.querySelector('[data-cy="input1-invalid-feedback"]');
  const oneInput = (value = 'preset') => ({
    kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding(value) }),
  });

  // Break this catches: the aggregation being computed once at mount instead of tracking its
  // children — the single most important thing this widget does. Every app reading
  // {{components.form1.formData}} would post whatever the fields held when the page loaded.
  test('[Form-DATA-006] a child value change republishes the Form aggregates', async () => {
    harness.render({ extraComponents: oneInput() });
    await waitFor(() => expect(harness.exposed().formData?.input1).toBe('preset'));

    await userEvent.clear(input());
    await userEvent.type(input(), 'edited');

    await waitFor(() => expect(harness.exposed().formData.input1).toBe('edited'));
    expect(harness.exposed().data.input1.value).toBe('edited');
    expect(harness.exposed().children.input1.value).toBe('edited');
  });

  // Break this catches: isValid being latched at mount, so a form that starts valid can never go
  // invalid — the submit gate would then let bad data through for the rest of the session.
  test('[Form-VALID-002] a child turning invalid flips the Form invalid, and back again', async () => {
    harness.render({
      extraComponents: oneInput('filled'),
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));

    await userEvent.clear(input());
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await userEvent.type(input(), 'refilled');
    await waitFor(() => expect(harness.exposed().isValid).toBe(true));
  });

  // Break this catches: firing onInvalid without raising the submit-attempt signal, so a user
  // presses submit, nothing happens, and no field tells them why.
  test('[Form-VALID-003] a failed submit reveals the children validation messages', async () => {
    harness.render({
      extraComponents: oneInput(''),
      events: countInvocationsOn(ID, 'onInvalid', { key: 'invalids' }),
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));
    // Nothing is shown before the user tries to submit.
    expect(err()?.textContent ?? '').toBe('');

    await harness.act('submitForm');

    await waitFor(() => expect(harness.variables()?.invalids).toBe(1));
    await waitFor(() => expect(err()?.textContent).toBeTruthy());
  });

  // Break this catches: dropping the formKey strip, leaking an internal pairing key into the data
  // every app reads and posts.
  test('[Form-DATA-007] formKey never leaks into data or children', async () => {
    harness.render({ extraComponents: oneInput() });
    await waitFor(() => expect(harness.exposed().data?.input1).toBeTruthy());

    expect(Object.keys(harness.exposed().data.input1)).not.toContain('formKey');
    expect(Object.keys(harness.exposed().children.input1)).not.toContain('formKey');
  });

  // Break this catches: characterizing what the aggregates hold while the children are unmounted by
  // a loading state, so a change to the loading path cannot silently alter what an app reads
  // mid-request.
  test('[Form-STATE-005] the aggregation while the Form is loading', async () => {
    harness.render({ extraComponents: oneInput() });
    await waitFor(() => expect(harness.exposed().formData?.input1).toBe('preset'));

    harness.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
    await waitFor(() => expect(harness.exposed().isLoading).toBe(true));
    await drain();

    // Measured: the children unmount but their last-published values remain in the aggregates —
    // the Form does not blank its data while loading.
    expect(harness.exposed().formData).toEqual({ input1: 'preset' });
    expect(harness.exposed().isValid).toBe(true);

    harness.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(input()).toBeTruthy());
    expect(harness.exposed().formData).toEqual({ input1: 'preset' });
  });
});

describe('Form: more submission and slot cases', () => {
  const input = () => document.getElementById('component-kid');

  // Break this catches: resetting on every submit attempt rather than only on success, which would
  // wipe everything a user typed the moment they hit submit with one field wrong.
  //
  // The seeded default is deliberately NON-empty: if the default were '' the two outcomes would be
  // indistinguishable, because a reset-to-default and a left-alone empty field look the same.
  test('[Form-RESET-004] an invalid submit never resets the Form', async () => {
    harness.render({
      extraComponents: { kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('preset') }) },
      events: countInvocationsOn(ID, 'onInvalid', { key: 'invalids' }),
      afterSeed: () => harness.setComponentProperty('kid', 'mandatory', '{{true}}', 'validation'),
    });
    await waitFor(() => expect(input()?.value).toBe('preset'));

    // Empty the mandatory field, which makes the Form invalid.
    await userEvent.clear(input());
    await waitFor(() => expect(harness.exposed().isValid).toBe(false));

    await harness.act('submitForm');
    await waitFor(() => expect(harness.variables()?.invalids).toBe(1));
    await drain();

    // A reset would have restored 'preset'; the user's empty field must survive instead.
    expect(input().value).toBe('');
  });

  // Break this catches: dropping the `!advanced` half of the slot guards, so a schema form renders
  // an empty header and footer around its generated fields.
  test('[Form-SLOT-008] JSON-schema mode renders neither slot', async () => {
    const schema = { title: 'T', properties: { name: { type: 'textinput' } }, submitButton: { value: 'Go' } };
    harness.render({
      properties: {
        showHeader: binding('{{true}}'),
        showFooter: binding('{{true}}'),
        generateFormFrom: binding('jsonSchema'),
        newJsonSchema: binding(`{{${JSON.stringify(schema)}}}`),
      },
    });
    await waitFor(() => expect(root()).toBeTruthy());
    expect(root().classList.contains('jet-container-json-form')).toBe(true);

    expect(header()).toBeNull();
    expect(footer()).toBeNull();
  });
});

describe('Form: nested in a Container', () => {
  // Break this catches: the nested sub-canvas resolving from the wrong id, or the two disabling
  // mechanisms interfering — the outer Container's `inert` must cover the subtree without the
  // Form's own fieldset believing it is disabled.
  test('[Form-NEST-002] a Form inside a Container renders and keeps its own disabled mechanism', async () => {
    const container = createWidgetHarness({
      componentType: 'Container',
      handle: 'container1',
      id: 'c1',
      capabilities: { dnd: true },
      widgetHeight: 600,
      widgetWidth: 600,
    });
    container.setup();
    try {
      const nested = componentDefinition(ID, NAME, 'Form');
      nested.component.parent = 'c1';
      container.render({
        properties: { disabledState: binding('{{true}}') },
        extraComponents: { [ID]: nested, kid: childOf(ID, 'kid', 'input1', 'TextInput', { value: binding('deep') }) },
      });

      await waitFor(() => expect(document.getElementById('component-kid')).toBeTruthy());

      // The Form renders its field through the recursive sub-canvas.
      const formRoot = [...document.querySelectorAll(`#${ID}`)].find((el) => el.tagName === 'FORM');
      expect(formRoot).toBeTruthy();
      expect(document.getElementById(`canvas-${ID}`).contains(document.getElementById('component-kid'))).toBe(true);

      // The outer Container disables by marking the subtree inert...
      const outer = document.getElementById('c1');
      await waitFor(() => expect(outer.inert).toBe(true));
      expect(outer.contains(formRoot)).toBe(true);
      // ...while the Form's own fieldset mechanism is untouched.
      expect(formRoot.querySelector('fieldset').disabled).toBe(false);
      expect(container.exposed(ID).isDisabled).toBe(false);
    } finally {
      container.teardown();
    }
  });
});
