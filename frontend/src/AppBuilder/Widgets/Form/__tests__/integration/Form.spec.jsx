/**
 * RTL scenarios from the Form testing contract
 * (ee/test/app-builder/widgets/Form/TESTING.md).
 *
 * Every test here runs against the REAL composed App Builder store, the real
 * resolver, the real `RenderWidget`/`Container` pair and real child widgets.
 * Form's whole contract is the aggregation it performs over its children, so a
 * mocked child would test nothing at all.
 *
 * Mounting a Form plus its children through the real canvas costs ~4s in
 * jsdom, which is over jest's 5s default. The timeout below is that cost, not
 * a hidden async wait — every assertion is driven by `waitFor` or an awaited
 * action, never by a sleep.
 */
import { renderHook, screen, waitFor } from '@testing-library/react';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import {
  binding,
  componentsById,
  containerChild,
  createWidgetHarness,
  drain,
  setVariableOn,
  store,
  MODULE_ID,
} from '../../../__tests__/integration/widgetHarness';

jest.setTimeout(60000);

const FORM_ID = 'form1';

/** The Form's own registered defaults, as `definition.properties` in form.js. */
const formDefaults = {
  showHeader: binding('{{false}}'),
  showFooter: binding('{{false}}'),
  advanced: binding('{{false}}'),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  dynamicHeight: binding('{{false}}'),
  validateOnSubmit: binding('{{true}}'),
  resetOnSubmit: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  headerHeight: binding(60),
  footerHeight: binding(60),
  generateFormFrom: binding(''),
  buttonToSubmit: binding('none'),
};

const form = createWidgetHarness({
  componentType: 'Form',
  handle: FORM_ID,
  id: FORM_ID,
  defaultProperties: formDefaults,
  // Every Form body child is a sub-container child, and `AppCanvas/Container`
  // throws `Expected drag drop context` without the real react-dnd provider.
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

beforeEach(() => form.setup());
afterEach(() => form.teardown());

/** A body child of this Form. */
const child = (id, name, componentType, properties, options = {}) =>
  containerChild(id, name, componentType, properties, { parent: FORM_ID, ...options });

/** A TextInput body child carrying `value` as its configured default. */
const textInput = (id, name, value, options) =>
  child(id, name, 'TextInput', { value: binding(value), label: binding(name) }, options);

/** A TextInput that is mandatory and starts empty, i.e. invalid on mount. */
const mandatoryEmpty = (id, name, slot) =>
  child(
    id,
    name,
    'TextInput',
    { value: binding(''), label: binding(name) },
    { slot, validation: { mandatory: binding('{{true}}') } }
  );

const button = (id, name, text = 'Submit', slot) => child(id, name, 'Button', { text: binding(text) }, { slot });

/** Form event handler, in the shape the shared harness produces. */
const onForm = (eventId, key) => setVariableOn(FORM_ID, eventId, { key, value: 'FIRED' })[0];

const formEl = () => document.getElementById(FORM_ID);
const bodySection = () => document.querySelector('[data-cy="form1-body-section"]');
const headerSection = () => document.querySelector('[data-cy="form1-header-section"]');
const footerSection = () => document.querySelector('[data-cy="form1-footer-section"]');

/** Waits until the Form has published an aggregate covering `count` fields. */
const waitForFields = (count) => waitFor(() => expect(Object.keys(form.exposed().data ?? {})).toHaveLength(count));

describe('field aggregation', () => {
  test('[Form-DATA-001] every body child appears in `data`, keyed by its component name', async () => {
    // Break this catches: keying the aggregate off the child's own exposed
    // `name` instead of its component definition drops any child that has not
    // reported yet, so a freshly loaded form submits a partial payload
    // (regression 62d9cae40e).
    form.render({
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), textInput('c2', 'lastname', 'Doe')),
    });

    await waitForFields(2);
    expect(form.exposed().data.firstname.value).toBe('Maria');
    expect(form.exposed().data.lastname.value).toBe('Doe');
  });

  test('[Form-DATA-002] `children` keeps child actions callable while `data` strips them', async () => {
    // Break this catches: giving `data` and `children` the SAME clone.
    // `removeFunctionObjects` deletes in place, so building `data` strips the
    // actions out of `children` as well and
    // `components.form1.children.x.setText()` is undefined in every RunJS
    // query (regression a16b314626). Note `deepClone` is rfdc and PRESERVES
    // functions — swapping the clone helper alone does not reproduce this.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });

    await waitForFields(1);
    expect(typeof form.exposed().children.firstname.setText).toBe('function');
    expect(Object.values(form.exposed().data.firstname).some((v) => typeof v === 'function')).toBe(false);
  });

  test('[Form-DATA-003] `formData` maps name to value and omits a child that exposes none', async () => {
    // Break this catches: writing every child into formData regardless of
    // whether it exposes a value puts `undefined` entries for Buttons and
    // Texts into the payload an app POSTs on submit.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), button('b1', 'submitbtn')) });

    await waitForFields(2);
    expect(form.exposed().formData).toEqual({ firstname: 'Maria' });
    // The Button is still a field of `data` — only `formData` is value-only.
    expect(Object.keys(form.exposed().data).sort()).toEqual(['firstname', 'submitbtn']);
  });

  test('[Form-DATA-004] a Form with no fields publishes empty aggregates and is valid', async () => {
    // Break this catches: dropping the no-children short-circuit leaves `data`
    // undefined instead of {}, so `{{components.form1.data.x}}` throws in every
    // binding on a form whose fields have not mounted yet.
    form.render({ extraComponents: {} });

    await waitFor(() => expect(form.exposed().isValid).toBe(true));
    expect(form.exposed().data).toEqual({});
    expect(form.exposed().formData).toEqual({});
    expect(form.exposed().children).toEqual({});
  });

  test('[Form-DATA-004] a Form with no fields still submits', async () => {
    // Break this catches: treating "no children" as "not yet valid" makes an
    // information-only form impossible to submit.
    form.render({ extraComponents: {}, events: [onForm('onSubmit', 'submitted')] });

    await form.act('submitForm');
    await drain();
    expect(form.variables().submitted).toBe('FIRED');
  });

  test('[Form-DATA-005] `formKey` never leaks into `data` or `children`', async () => {
    // Break this catches: leaving formKey on the entry publishes the
    // Inspector's internal field-mapping key as part of the app-visible
    // payload, where an app author would start depending on it.
    form.render({
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
      afterSeed: () => {
        // formKey lives on the component definition, not on a property, so it
        // has no seed-time argument — this is the documented escape hatch.
        store().getComponentDefinition('c1', MODULE_ID).component.formKey = 'first_name';
      },
    });

    await waitForFields(1);
    expect(form.exposed().data.firstname).not.toHaveProperty('formKey');
    expect(form.exposed().children.firstname).not.toHaveProperty('formKey');
  });

  test('[Form-DATA-006] a child value change republishes the aggregates', async () => {
    // Break this catches: aggregating once on mount instead of on every child
    // change freezes `data` at its initial values, so a submit sends whatever
    // the form looked like before the user typed.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitForFields(1);

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Alex');
    });

    await waitFor(() => expect(form.exposed().formData).toEqual({ firstname: 'Alex' }));
    expect(form.exposed().data.firstname.value).toBe('Alex');
  });

  test('[Form-DATA-007] a header child is chrome: absent from the aggregates and from validity', async () => {
    // Break this catches: unioning the slot mappings into the Form's child list
    // would make the header Text and footer Button part of the submitted
    // payload, and would let a decorative slot input block every submit.
    form.render({
      properties: { showHeader: binding('{{true}}') },
      extraComponents: componentsById(
        textInput('c1', 'firstname', 'Maria'),
        mandatoryEmpty('h1', 'headerfield', 'header')
      ),
    });

    await waitForFields(1);
    expect(Object.keys(form.exposed().data)).toEqual(['firstname']);
    expect(form.exposed().formData).toEqual({ firstname: 'Maria' });
    expect(form.exposed().children).not.toHaveProperty('headerfield');
    // The slot child is invalid, yet the Form is valid: slots are not fields.
    expect(form.exposed().isValid).toBe(true);
  });
});

describe('validity', () => {
  test('[Form-VALID-001] `isValid` is the conjunction of every body child', async () => {
    // Break this catches: replacing the AND with an OR (or short-circuiting on
    // the first child) reports a form valid while a required field is empty,
    // so onSubmit fires on an incomplete payload.
    form.render({
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), mandatoryEmpty('c2', 'lastname')),
    });

    await waitFor(() => expect(form.exposed().isValid).toBe(false));
  });

  test('[Form-VALID-001] a child reporting no validity is treated as valid', async () => {
    // Break this catches: defaulting a missing `isValid` to false makes any
    // form containing a Button or Text permanently unsubmittable.
    form.render({ extraComponents: componentsById(button('b1', 'submitbtn')) });

    await waitFor(() => expect(form.exposed().isValid).toBe(true));
  });

  test('[Form-VALID-002] a child turning invalid flips the Form invalid, and back again', async () => {
    // Break this catches: caching the aggregate validity instead of recomputing
    // it leaves the form stuck invalid after the user fixes the field, so the
    // submit button never re-enables.
    form.render({
      extraComponents: componentsById(
        child(
          'c1',
          'firstname',
          'TextInput',
          { value: binding('Maria') },
          {
            validation: { minLength: binding('3') },
          }
        )
      ),
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(true));

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Ma');
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Maria');
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(true));
  });

  test('[Form-VALID-003] a failed submit reveals child validation messages; a successful one clears them', async () => {
    // Break this catches: not resetting submitAttemptCount inside the onSubmit
    // continuation leaves every field's error message on screen after the user
    // has fixed the form and submitted successfully (regression cd96d19519).
    form.render({
      extraComponents: componentsById(mandatoryEmpty('c1', 'firstname')),
      events: [onForm('onSubmit', 'submitted'), onForm('onInvalid', 'invalid')],
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));
    expect(screen.queryByText('Field cannot be empty')).toBeNull();

    await form.act('submitForm');
    expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Maria');
    });
    await form.act('submitForm');

    await waitFor(() => expect(screen.queryByText('Field cannot be empty')).toBeNull());
  });
});

describe('submission', () => {
  const submitEvents = [onForm('onSubmit', 'submitted'), onForm('onInvalid', 'invalid')];

  test('[Form-SUBMIT-001] `submitForm()` fires `onSubmit` when the Form is valid', async () => {
    // Break this catches: an inverted validity guard swaps the two events, so
    // every valid submit silently runs the app's error handler instead.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')), events: submitEvents });

    await form.act('submitForm');
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
    expect(form.variables().invalid).toBeUndefined();
  });

  test('[Form-SUBMIT-002] `submitForm()` fires `onInvalid` and never `onSubmit` when a field is invalid', async () => {
    // Break this catches: dropping `isValid` from the deps of the effect that
    // publishes the action leaves it closed over the validity at mount, so a
    // form that became invalid after load still submits (regression 639acb38ed).
    form.render({
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), mandatoryEmpty('c2', 'lastname')),
      events: submitEvents,
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));

    await form.act('submitForm');
    await drain();

    expect(form.variables().invalid).toBe('FIRED');
    expect(form.variables().submitted).toBeUndefined();
  });

  test('[Form-SUBMIT-002] validity is read at call time, not at mount', async () => {
    // Break this catches: the exact stale-closure shape of 639acb38ed — the
    // form mounts VALID and only then becomes invalid, which the mount-time
    // closure cannot see.
    form.render({
      extraComponents: componentsById(
        child(
          'c1',
          'firstname',
          'TextInput',
          { value: binding('Maria') },
          {
            validation: { minLength: binding('3') },
          }
        )
      ),
      events: submitEvents,
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(true));

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Ma');
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));
    await form.act('submitForm');
    await drain();

    expect(form.variables().invalid).toBe('FIRED');
    expect(form.variables().submitted).toBeUndefined();
  });

  test('[Form-SUBMIT-003] with `validateOnSubmit` off, an invalid Form still submits', async () => {
    // Break this catches: validating unconditionally makes the documented
    // opt-out inert, so a form deliberately collecting partial input can never
    // be submitted.
    form.render({
      properties: { validateOnSubmit: binding('{{false}}') },
      extraComponents: componentsById(mandatoryEmpty('c1', 'firstname')),
      events: submitEvents,
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));

    await form.act('submitForm');
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
    expect(form.variables().invalid).toBeUndefined();
  });

  test('[Form-SUBMIT-004] clicking the Button named by `buttonToSubmit` submits the Form', async () => {
    // Break this catches: never registering the document-level submitForm
    // listener leaves the configured submit button inert, which is the single
    // most common way an app is built.
    form.render({
      properties: { buttonToSubmit: binding('b1') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), button('b1', 'submitbtn')),
      events: submitEvents,
    });
    await waitForFields(2);

    await form.session.user.click(screen.getByRole('button', { name: 'Submit' }));
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
  });

  test('[Form-SUBMIT-005] a Button that is not the submit button does not submit the Form', async () => {
    // Break this catches: removing the `buttonToSubmit === buttonComponentId`
    // comparison makes EVERY button inside a form submit it, so a "Cancel" or
    // "Add row" button fires the app's submit query.
    form.render({
      properties: { buttonToSubmit: binding('b1') },
      extraComponents: componentsById(button('b1', 'submitbtn', 'Submit'), button('b2', 'cancelbtn', 'Cancel')),
      events: submitEvents,
    });
    await waitForFields(2);

    await form.session.user.click(screen.getByRole('button', { name: 'Cancel' }));
    await drain();

    expect(form.variables().submitted).toBeUndefined();
  });

  test('[Form-SUBMIT-006] a submit event from another module never submits this Form', async () => {
    // Break this catches: comparing only the button id lets a Button with the
    // same id in a different module submit this form — the exact cross-module
    // collision fixed in 0792a04d9c.
    form.render({
      properties: { buttonToSubmit: binding('b1') },
      extraComponents: componentsById(button('b1', 'submitbtn')),
      events: submitEvents,
    });
    await waitForFields(1);

    await form.session.store.act(async () => {
      document.dispatchEvent(
        new CustomEvent('submitForm', { detail: { buttonComponentId: 'b1', buttonModuleId: 'some-other-module' } })
      );
    });
    await drain();
    expect(form.variables().submitted).toBeUndefined();

    await form.session.store.act(async () => {
      document.dispatchEvent(
        new CustomEvent('submitForm', { detail: { buttonComponentId: 'b1', buttonModuleId: MODULE_ID } })
      );
    });
    await drain();
    expect(form.variables().submitted).toBe('FIRED');
  });

  test('[Form-SUBMIT-007] submitting the Form never navigates the page', async () => {
    // Break this catches: dropping preventDefault turns Enter in any field
    // into a full-page GET that unloads the app.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitForFields(1);

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    await form.session.store.act(async () => {
      formEl().dispatchEvent(submitEvent);
    });

    expect(submitEvent.defaultPrevented).toBe(true);
  });
});

describe('reset and clear', () => {
  const valueOf = (id = 'c1') => store().getExposedValueOfComponent(id, MODULE_ID)?.value;

  test('[Form-RESET-001] `resetForm()` restores fields to their configured defaults', async () => {
    // Break this catches: clearing instead of remounting makes reset behave
    // like clear, wiping the defaults an author configured for the form.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitForFields(1);

    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Alex');
    });
    await waitFor(() => expect(valueOf()).toBe('Alex'));

    await form.act('resetForm');

    await waitFor(() => expect(valueOf()).toBe('Maria'));
  });

  test('[Form-CLEAR-001] `clearForm()` empties the fields instead of restoring defaults', async () => {
    // Break this catches: routing clearForm through resetComponent makes it a
    // duplicate of resetForm, so "clear" puts the default values back and the
    // user cannot empty the form.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitFor(() => expect(valueOf()).toBe('Maria'));

    await form.act('clearForm');

    await waitFor(() => expect(valueOf()).toBe(''));
  });

  test('[Form-CLEAR-002] a field added after a clear keeps its own default', async () => {
    // Break this catches: dropping the mount-time clearCount snapshot in
    // useFormClear makes every newly dropped field instantly wipe itself if the
    // form was ever cleared — the bug fixed inside 36034d81e1.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitFor(() => expect(valueOf()).toBe('Maria'));

    await form.act('clearForm');
    await waitFor(() => expect(valueOf()).toBe(''));

    // Re-render the same page with an extra field: the new child mounts into a
    // Form whose clearCount is already 1.
    form.render({
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), textInput('c2', 'lastname', 'Doe')),
    });

    await waitFor(() => expect(valueOf('c2')).toBe('Doe'));
  });

  test('[Form-RESET-002] a successful submit resets the fields when `resetOnSubmit` is on', async () => {
    // Break this catches: resetting outside the onSubmit continuation (or not
    // at all) either wipes the form before the submit query has read it, or
    // leaves stale values in a form meant to accept the next entry.
    form.render({
      properties: { resetOnSubmit: binding('{{true}}') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
      events: [onForm('onSubmit', 'submitted')],
    });
    await waitForFields(1);
    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Alex');
    });
    await waitFor(() => expect(valueOf()).toBe('Alex'));

    await form.act('submitForm');

    // Awaited, not tick-counted: D-06 records that WHEN the reset lands is not
    // part of the contract, only that it does.
    await waitFor(() => expect(valueOf()).toBe('Maria'));
    expect(form.variables().submitted).toBe('FIRED');
  });

  test('[Form-RESET-002] a successful submit leaves the fields alone when `resetOnSubmit` is off', async () => {
    // Break this catches: resetting unconditionally destroys the entered values
    // on every submit for authors who deliberately keep them.
    form.render({
      properties: { resetOnSubmit: binding('{{false}}') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
      events: [onForm('onSubmit', 'submitted')],
    });
    await waitForFields(1);
    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Alex');
    });

    await form.act('submitForm');
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
    expect(valueOf()).toBe('Alex');
  });

  test('[Form-RESET-003] an invalid submit never resets the Form', async () => {
    // Break this catches: moving the reset above the validity guard wipes
    // everything the user typed the moment they submit an incomplete form,
    // which is the worst possible moment to lose it.
    form.render({
      properties: { resetOnSubmit: binding('{{true}}') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria'), mandatoryEmpty('c2', 'lastname')),
      events: [onForm('onInvalid', 'invalid')],
    });
    await waitFor(() => expect(form.exposed().isValid).toBe(false));
    await form.session.store.act(async () => {
      await store().getExposedValueOfComponent('c1', MODULE_ID).setText('Alex');
    });

    await form.act('submitForm');
    await drain();

    expect(form.variables().invalid).toBe('FIRED');
    expect(valueOf()).toBe('Alex');
  });
});

describe('visibility, disabled and loading', () => {
  test('[Form-STATE-001] `visibility: {{false}}` hides the Form, and flipping it back shows it', async () => {
    // Break this catches: ignoring the resolved visibility renders a form an
    // author deliberately hid, leaking a whole section of the app.
    form.render({ properties: { visibility: binding('{{false}}') }, extraComponents: {} });

    await waitFor(() => expect(formEl()).toHaveStyle({ display: 'none' }));

    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'visibility', '{{true}}', 'properties');
    });

    await waitFor(() => expect(formEl()).toHaveStyle({ display: 'flex' }));
  });

  test('[Form-STATE-002] `setVisibility(false)` survives an unrelated property re-resolve', async () => {
    // Break this catches: re-seeding hook state from properties on every render
    // makes any unrelated property write silently undo a setVisibility() call
    // an app made moments earlier.
    form.render({ extraComponents: {} });
    await waitFor(() => expect(formEl()).toHaveStyle({ display: 'flex' }));

    await form.act('setVisibility', false);
    await waitFor(() => expect(formEl()).toHaveStyle({ display: 'none' }));

    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'showHeader', '{{true}}', 'properties');
    });
    await drain();
    expect(formEl()).toHaveStyle({ display: 'none' });

    // Nor does rewriting `visibility` to the value it already holds: the hook
    // keys on the property VALUE, so a no-op write is not a change.
    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'visibility', '{{true}}', 'properties');
    });
    await drain();
    expect(formEl()).toHaveStyle({ display: 'none' });

    // Only a genuine change to `visibility` takes precedence back.
    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'visibility', '{{false}}', 'properties');
    });
    await drain();
    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'visibility', '{{true}}', 'properties');
    });
    await waitFor(() => expect(formEl()).toHaveStyle({ display: 'flex' }));
  });

  test('[Form-STATE-003] a disabled Form disables its body fieldset', async () => {
    // Break this catches: dropping the fieldset `disabled` attribute leaves
    // every field editable and tabbable on a form the author disabled.
    form.render({
      properties: { disabledState: binding('{{true}}') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
    });

    await waitFor(() => expect(bodySection().querySelector('fieldset')).toBeDisabled());
  });

  test('[Form-STATE-003] `setDisable(true)` survives a no-op rewrite of `disabledState`', async () => {
    // Break this catches: keying the disable effect on render rather than on
    // the property value lets an unrelated re-resolve re-enable a form an app
    // disabled while a query is in flight.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitFor(() => expect(bodySection().querySelector('fieldset')).not.toBeDisabled());

    await form.act('setDisable', true);
    await waitFor(() => expect(bodySection().querySelector('fieldset')).toBeDisabled());

    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'disabledState', '{{false}}', 'properties');
    });
    await drain();

    expect(bodySection().querySelector('fieldset')).toBeDisabled();
  });

  test('[Form-STATE-003] a disabled Form overlays its slots', async () => {
    // Break this catches: slots live OUTSIDE the disabled fieldset, so without
    // their own overlay a disabled form still accepts clicks on its header and
    // footer — including on the submit button.
    form.render({
      properties: { disabledState: binding('{{true}}'), showFooter: binding('{{true}}') },
      extraComponents: componentsById(button('b1', 'submitbtn', 'Submit', 'footer')),
    });

    await waitFor(() => expect(footerSection().querySelector('.tj-form-disabled-overlay')).not.toBeNull());
  });

  test('[Form-STATE-004] a loading Form shows a spinner and neither slot', async () => {
    // Break this catches: rendering the slots while loading frames a spinner
    // with a live header and footer, so the submit button is clickable on a
    // form whose fields have not loaded (regression cc9db188b8).
    form.render({
      properties: {
        loadingState: binding('{{true}}'),
        showHeader: binding('{{true}}'),
        showFooter: binding('{{true}}'),
      },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
    });

    await waitFor(() => expect(bodySection().querySelector('.spinner-border')).not.toBeNull());
    expect(headerSection()).toBeNull();
    expect(footerSection()).toBeNull();
  });

  test('[Form-STATE-005] `setLoading(true)` survives a no-op rewrite of `loadingState`', async () => {
    // Break this catches: the same precedence bug as setDisable — an unrelated
    // re-resolve dismisses the spinner an app raised for an in-flight query.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitFor(() => expect(bodySection().querySelector('.spinner-border')).toBeNull());

    await form.act('setLoading', true);
    await waitFor(() => expect(bodySection().querySelector('.spinner-border')).not.toBeNull());

    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'loadingState', '{{false}}', 'properties');
    });
    await drain();

    expect(bodySection().querySelector('.spinner-border')).not.toBeNull();
  });

  test('[Form-STATE-006] `isVisible`, `isDisabled` and `isLoading` report the effective state', async () => {
    // Break this catches: exposing the raw property instead of the effective
    // state makes `{{components.form1.isLoading}}` disagree with what the user
    // sees the moment an action, not a property, set it.
    form.render({ extraComponents: {} });
    await waitFor(() => expect(form.exposed().isVisible).toBe(true));
    expect(form.exposed().isDisabled).toBe(false);
    expect(form.exposed().isLoading).toBe(false);

    await form.act('setDisable', true);
    await form.act('setLoading', true);
    await form.act('setVisibility', false);

    await waitFor(() => expect(form.exposed().isDisabled).toBe(true));
    expect(form.exposed().isLoading).toBe(true);
    expect(form.exposed().isVisible).toBe(false);
  });

  test('[Form-STATE-009] a disabled Form still submits programmatically', async () => {
    // Break this catches: adding an isDisabled guard to fireSubmissionEvent
    // would break every app that disables a form during an in-flight query and
    // still submits it from a handler (D-09).
    form.render({
      properties: { disabledState: binding('{{true}}') },
      extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')),
      events: [onForm('onSubmit', 'submitted')],
    });
    await waitForFields(1);

    await form.act('submitForm');
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
  });
});

describe('header and footer slots', () => {
  test.each([
    ['neither slot', false, false],
    ['the header only', true, false],
    ['the footer only', false, true],
    ['both slots', true, true],
  ])('[Form-SLOT-001] the toggles render exactly %s', async (_name, showHeader, showFooter) => {
    // Break this catches: wiring both sections to one toggle, or inverting
    // either, shows a header on forms that asked for none and hides the footer
    // holding the submit button.
    form.render({
      properties: { showHeader: binding(`{{${showHeader}}}`), showFooter: binding(`{{${showFooter}}}`) },
      extraComponents: {},
    });

    await waitFor(() => expect(bodySection()).not.toBeNull());
    expect(headerSection() !== null).toBe(showHeader);
    expect(footerSection() !== null).toBe(showFooter);
  });

  test('[Form-SLOT-003] schema mode renders neither slot', async () => {
    // Break this catches: rendering slots in schema mode puts an empty header
    // and footer around a form whose title and submit button come from the
    // schema itself, duplicating both.
    form.render({
      properties: {
        generateFormFrom: binding('jsonSchema'),
        showHeader: binding('{{true}}'),
        showFooter: binding('{{true}}'),
        newJsonSchema: binding("{{ ({ title: 'T', properties: { a: { type: 'textinput', label: 'A' } } }) }}"),
      },
      extraComponents: {},
    });

    await waitFor(() => expect(bodySection()).not.toBeNull());
    expect(headerSection()).toBeNull();
    expect(footerSection()).toBeNull();
  });
});

describe('JSON schema mode', () => {
  const schema =
    "{{ ({ title: 'Registration', properties: { firstname: { type: 'textinput', label: 'First name', value: 'Maria' } }, submitButton: { value: 'Send' } }) }}";

  test('[Form-SCHEMA-001] `generateFormFrom: jsonSchema` renders the schema instead of the dropped children', async () => {
    // Break this catches: reading the wrong store key for schema mode renders
    // the drag-and-drop children AND the schema, doubling every field.
    form.render({
      properties: { generateFormFrom: binding('jsonSchema'), newJsonSchema: binding(schema) },
      extraComponents: componentsById(textInput('c1', 'droppedchild', 'ShouldNotRender')),
    });

    expect(await screen.findByText('First name')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('ShouldNotRender')).toBeNull();
  });

  test('[Form-SCHEMA-004] schema mode keys `data` by the schema property key and publishes no field map in `children`', async () => {
    // Break this catches: keying schema data by array index, or by the visible
    // label instead of the schema property key, makes
    // `{{components.form1.data.firstname}}` undefined for every JSON-schema form.
    form.render({
      properties: { generateFormFrom: binding('jsonSchema'), newJsonSchema: binding(schema) },
      extraComponents: {},
    });

    await waitFor(() => expect(Object.keys(form.exposed().data ?? {})).toContain('firstname'));
    expect(form.exposed().children).toEqual([]);
  });

  test('[Form-SCHEMA-005] the schema submit button fires `onSubmit`', async () => {
    // Break this catches: the schema button is matched POSITIONALLY as the last
    // generated component, so any change to generation order silently stops
    // every JSON-schema form from submitting (regression 6bdb808239).
    form.render({
      properties: { generateFormFrom: binding('jsonSchema'), newJsonSchema: binding(schema) },
      extraComponents: {},
      events: [onForm('onSubmit', 'submitted')],
    });

    await form.session.user.click(await screen.findByRole('button', { name: 'Send' }));
    await drain();

    expect(form.variables().submitted).toBe('FIRED');
  });

  test('[Form-SCHEMA-006] an app saved with `advanced: true` still renders the deprecated schema path', async () => {
    // Break this catches: reading only `newJsonSchema` blanks every Form saved
    // before Form 2.0, since those carry `advanced` + `JSONSchema` and no
    // `generateFormFrom` at all (D-05).
    form.render({
      properties: { advanced: binding('{{true}}'), JSONSchema: binding(schema), generateFormFrom: binding('') },
      extraComponents: {},
    });

    expect(await screen.findByText('First name')).toBeInTheDocument();
    expect(await screen.findByText('Registration')).toBeInTheDocument();
  });
});

describe('styling', () => {
  test('[Form-STYLE-001] container styles reach the form element', async () => {
    // Break this catches: dropping the clipPath lets children paint over the
    // rounded corners, and dropping the border leaves the form indistinguishable
    // from the canvas.
    form.render({
      styles: {
        borderRadius: binding('12'),
        borderColor: binding('rgb(1, 2, 3)'),
        backgroundColor: binding('rgb(4, 5, 6)'),
      },
      extraComponents: {},
    });

    await waitFor(() => expect(formEl()).not.toBeNull());
    expect(formEl()).toHaveStyle({ backgroundColor: 'rgb(4, 5, 6)', borderRadius: '12px' });
    expect(formEl().style.border).toContain('rgb(1, 2, 3)');
    expect(formEl().style.clipPath).toBe('inset(0 round 12px)');
  });

  test('[Form-STYLE-002] slot colours reach the slots and the divider custom properties', async () => {
    // Break this catches: publishing the divider colours under the wrong custom
    // property names leaves both dividers at their fallback colour, which is
    // invisible on a dark surface.
    form.render({
      properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') },
      styles: {
        headerBackgroundColor: binding('rgb(10, 10, 10)'),
        footerBackgroundColor: binding('rgb(20, 20, 20)'),
        headerDividerColor: binding('rgb(30, 30, 30)'),
        footerDividerColor: binding('rgb(40, 40, 40)'),
      },
      extraComponents: {},
    });

    await waitFor(() => expect(headerSection()).not.toBeNull());
    expect(headerSection()).toHaveStyle({ backgroundColor: 'rgb(10, 10, 10)' });
    expect(footerSection()).toHaveStyle({ backgroundColor: 'rgb(20, 20, 20)' });
    expect(formEl().style.getPropertyValue('--cc-form-header-divider-color')).toBe('rgb(30, 30, 30)');
    expect(formEl().style.getPropertyValue('--cc-form-footer-divider-color')).toBe('rgb(40, 40, 40)');
  });

  test('[Form-STYLE-003] a white Form is re-toned in dark mode', async () => {
    // Break this catches: dropping the dark-mode substitution renders a default
    // white form as a glaring white block on a dark canvas — and it must apply
    // to all three surfaces, not just the body.
    form.render({
      properties: { showHeader: binding('{{true}}'), showFooter: binding('{{true}}') },
      styles: {
        backgroundColor: binding('#fff'),
        headerBackgroundColor: binding('#fff'),
        footerBackgroundColor: binding('#fff'),
      },
      darkMode: true,
      extraComponents: {},
    });

    await waitFor(() => expect(headerSection()).not.toBeNull());
    expect(formEl()).toHaveStyle({ backgroundColor: '#232E3C' });
    expect(headerSection()).toHaveStyle({ backgroundColor: '#1F2837' });
    expect(footerSection()).toHaveStyle({ backgroundColor: '#1F2837' });
  });
});

describe('layout', () => {
  test('[Form-LAYOUT-002] dynamic height is inert in the editor', async () => {
    // Break this catches: enabling dynamic reflow in edit mode makes the Form
    // resize itself while the author is dragging fields into it, fighting the
    // layout engine on every drop.
    form.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit', extraComponents: {} });

    await waitFor(() => expect(formEl()).not.toBeNull());
    expect(bodySection().className).not.toContain(`dynamic-${FORM_ID}`);
    expect(formEl().style.height).not.toBe('100%');
  });

  test('[Form-LAYOUT-002] dynamic height is active in the viewer', async () => {
    // Break this catches: gating on the wrong mode string disables dynamic
    // height everywhere, so forms in the viewer keep a fixed height and clip
    // their own content.
    form.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view', extraComponents: {} });

    await waitFor(() => expect(formEl()).not.toBeNull());
    expect(bodySection().className).toContain(`dynamic-${FORM_ID}`);
    expect(formEl()).toHaveStyle({ height: '100%' });
  });

  test('[Form-LAYOUT-003] the form body fills the form, and the dead canHeight state does not change that', async () => {
    // Break this catches: this is the characterization D-01 approved. The body
    // has always rendered at 100% because `canHeight` is read before its own
    // useState and resolves to undefined under this repo's Babel target. If
    // deleting that dead state ever changes this height, the deletion was not
    // behaviour-preserving.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });

    await waitFor(() => expect(bodySection()).not.toBeNull());
    expect(bodySection()).toHaveStyle({ height: '100%' });
  });
});

describe('known defects, pinned', () => {
  test('[Form-STATE-008] a Form configured hidden is visible on its first commit', async () => {
    // Break this catches: characterization of the shared useExposeState defect
    // (D-04). `useState(visibleState || true)` cannot represent an initial
    // `false`, so the hook reports VISIBLE on the first commit and only the
    // follow-up effect hides it — a Form saved hidden flashes into view.
    //
    // Asserted at the hook itself because the flash is one commit wide: RTL's
    // render() flushes effects inside act(), so by the time the DOM is
    // queryable the effect has already corrected it. Fixing the hook to honour
    // an explicit `false` SHOULD fail this test — that is the signal the flash
    // is gone, and this test is then deleted.
    const seen = [];
    renderHook(() =>
      seen.push(
        useExposeState(
          false,
          /* visibleState */ false,
          false,
          () => {},
          () => {}
        ).isVisible
      )
    );

    expect(seen[0]).toBe(true);
    expect(seen[seen.length - 1]).toBe(false);
  });

  test('[Form-STATE-007] what `data` holds while the Form is loading', async () => {
    // Break this catches: characterization. Loading unmounts the body
    // sub-container, so this pins whether the aggregates keep the last reported
    // values or empty out mid-query. A change here means apps reading
    // `components.form1.data` during a load start seeing something different.
    form.render({ extraComponents: componentsById(textInput('c1', 'firstname', 'Maria')) });
    await waitForFields(1);

    await form.act('setLoading', true);
    await drain();

    expect(form.exposed().data).toEqual({ firstname: expect.objectContaining({ value: 'Maria' }) });
  });

  test('[Form-SCHEMA-007] a batched write that also changes generateFormFrom loses the other property', async () => {
    // Break this catches: characterization of D-08. The memo comparator counts
    // TOP-LEVEL diff keys only, so `properties` changing both generateFormFrom
    // (to a non-jsonSchema value) and showHeader together is treated as the
    // no-op data-source change and skipped. Tightening the guard SHOULD fail
    // this test.
    // Control: showHeader alone DOES re-render, so the skip below is the
    // comparator's doing and not a broken property write.
    form.render({ properties: { showHeader: binding('{{false}}') }, extraComponents: {} });
    await waitFor(() => expect(formEl()).not.toBeNull());
    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'showHeader', '{{true}}', 'properties');
    });
    await waitFor(() => expect(headerSection()).not.toBeNull());

    // The defect: the same showHeader write, batched with a generateFormFrom
    // change to a non-jsonSchema value, is swallowed.
    form.render({
      properties: { generateFormFrom: binding('jsonSchema'), showHeader: binding('{{false}}') },
      extraComponents: {},
    });
    await waitFor(() => expect(headerSection()).toBeNull());

    await form.session.store.act(async () => {
      form.setComponentProperty(FORM_ID, 'generateFormFrom', 'rawJson', 'properties');
      form.setComponentProperty(FORM_ID, 'showHeader', '{{true}}', 'properties');
    });
    await drain();

    expect(headerSection()).toBeNull();
  });
});
