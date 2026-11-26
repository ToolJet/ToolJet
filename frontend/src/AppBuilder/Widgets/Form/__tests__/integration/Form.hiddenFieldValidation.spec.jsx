/**
 * Form — "Validate visible fields only" (`validateVisibleFieldsOnly`).
 *
 * Form has no widget test contract yet (`widget-testing-manifest.json`:
 * not-started); this is a standalone regression spec until it is backfilled.
 *
 * Product rule: the toggle is off by default, for existing and new Forms, so a
 * hidden invalid field still blocks the Form. When it is on, the Form skips
 * child fields with `isVisible` false when it works out `isValid`. The hidden
 * field keeps its own `isValid`; only the Form ignores it.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'form-hidden-field-validation',
  name: 'Form validates visible fields only when the toggle is on',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Form renders its body through AppCanvas/Container.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const formDefinition = ({ validateVisibleFieldsOnly } = {}) =>
  componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{true}}'),
    showFooter: binding('{{true}}'),
    buttonToSubmit: binding('submit1'),
    ...(validateVisibleFieldsOnly !== undefined && {
      validateVisibleFieldsOnly: binding(`{{${validateVisibleFieldsOnly}}}`),
    }),
  });

function child(id, type, parent, properties = {}, options = {}) {
  const def = componentDefinition(id, id, type, properties, options);
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
}

const requiredTextInput = (id, visible) =>
  child(
    id,
    'TextInput',
    'form1',
    { visibility: binding(visible ? '{{true}}' : '{{false}}') },
    { validation: { mandatory: binding('{{true}}') } }
  );

const requiredTextInputIn = (id, parent) =>
  child(
    id,
    'TextInput',
    parent,
    { visibility: binding('{{true}}') },
    { validation: { mandatory: binding('{{true}}') } }
  );

const container = (id, parent, visible) =>
  child(id, 'Container', parent, { visibility: binding(visible ? '{{true}}' : '{{false}}') });

const counter = (sourceId, eventId, key) => ({
  id: `evt-${sourceId}-${eventId}`,
  index: 0,
  sourceId,
  name: `evt-${sourceId}-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const count = (key) => state().getVariable(key, 'canvas') ?? 0;
const exposed = (id) => state().getExposedValueOfComponent(id, MODULE_ID);

let session;

async function renderForm(fields, formOptions) {
  seedApp(
    {
      form1: formDefinition(formOptions),
      ...fields,
      submit1: child('submit1', 'Button', 'form1-footer', { text: binding('Submit') }),
    },
    { moduleId: MODULE_ID }
  );
  state().eventsSlice.setEvents(
    [counter('form1', 'onSubmit', 'formSubmits'), counter('form1', 'onInvalid', 'formInvalids')],
    MODULE_ID
  );
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  session.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
  await drain();
}

const clickSubmit = () => session.user.click(screen.getByRole('button', { name: 'Submit' }));

describe('Form with a hidden required field', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  describe('"Validate visible fields only" off (default)', () => {
    test('a hidden empty required field still blocks submit', async () => {
      // Break this catches: skipping hidden fields without the toggle, which
      // changes how every existing Form validates.
      await renderForm({ hidden1: requiredTextInput('hidden1', false) });

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(false);
      expect(count('formSubmits')).toBe(0);
      expect(count('formInvalids')).toBe(1);
    });
  });

  describe('"Validate visible fields only" on', () => {
    const on = { validateVisibleFieldsOnly: true };

    test('a hidden empty required field does not block submit', async () => {
      // Break this catches: the Form counting a hidden field's isValid=false,
      // so the user is blocked by a field they cannot see or fill.
      await renderForm({ hidden1: requiredTextInput('hidden1', false) }, on);
      expect(exposed('hidden1').isValid).toBe(false);

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(true);
      expect(count('formSubmits')).toBe(1);
      expect(count('formInvalids')).toBe(0);
    });

    test('a visible empty required field still blocks submit', async () => {
      // Break this catches: skipping every child, or skipping a child whose
      // isVisible is missing or true.
      await renderForm({ hidden1: requiredTextInput('hidden1', false), shown1: requiredTextInput('shown1', true) }, on);

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(false);
      expect(count('formSubmits')).toBe(0);
      expect(count('formInvalids')).toBe(1);
    });

    test('showing the hidden field again makes the Form count it', async () => {
      // Break this catches: deciding visibility once, so a field shown later
      // (here through its setVisibility action) is still skipped.
      await renderForm({ hidden1: requiredTextInput('hidden1', false) }, on);
      expect(exposed('form1').isValid).toBe(true);

      await act(async () => exposed('hidden1').setVisibility(true));
      await drain();

      expect(exposed('form1').isValid).toBe(false);
    });
  });

  describe('a field inside a hidden Container', () => {
    const on = { validateVisibleFieldsOnly: true };

    test('with the toggle off, it still blocks submit', async () => {
      // Break this catches: skipping fields under a hidden Container without the
      // toggle, which changes how every existing Form validates.
      await renderForm({ box1: container('box1', 'form1', false), inBox1: requiredTextInputIn('inBox1', 'box1') });

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(false);
      expect(count('formSubmits')).toBe(0);
    });

    test('with the toggle on, it does not block submit, and the Form still collects it', async () => {
      // Break this catches: reading only the field's own isVisible, which stays
      // true when its Container is hidden; or dropping the field from form data.
      await renderForm({ box1: container('box1', 'form1', false), inBox1: requiredTextInputIn('inBox1', 'box1') }, on);
      expect(exposed('inBox1').isVisible).toBe(true);
      expect(exposed('inBox1').isValid).toBe(false);

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(true);
      expect(count('formSubmits')).toBe(1);
      expect(exposed('form1').formData).toHaveProperty('inBox1');
    });

    test('with the toggle on, a field two Containers deep under a hidden Container does not block submit', async () => {
      // Break this catches: checking only the field's direct parent, so a hidden
      // outer Container does not hide the fields of an inner, visible one.
      await renderForm(
        {
          outer1: container('outer1', 'form1', false),
          inner1: container('inner1', 'outer1', true),
          deep1: requiredTextInputIn('deep1', 'inner1'),
        },
        on
      );

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(true);
      expect(count('formSubmits')).toBe(1);
    });

    test('with the toggle on, a field in the header of a hidden Container does not block submit', async () => {
      // Break this catches: the walk not hiding a hidden Container's header slot,
      // so a required field there blocks the Form again.
      const box = child('box1', 'Container', 'form1', {
        visibility: binding('{{false}}'),
        showHeader: binding('{{true}}'),
      });
      await renderForm({ box1: box, inHeader1: requiredTextInputIn('inHeader1', 'box1-header') }, on);
      expect(exposed('inHeader1').isValid).toBe(false);

      await clickSubmit();
      await drain();

      expect(exposed('form1').isValid).toBe(true);
      expect(count('formSubmits')).toBe(1);
      expect(exposed('form1').formData).toHaveProperty('inHeader1');
    });

    test('with the toggle on, showing the Container again shows the field and makes the Form count it', async () => {
      // Break this catches: deciding visibility once, so a field whose Container
      // is shown later is still skipped; or the field not coming back on screen.
      await renderForm({ box1: container('box1', 'form1', false), inBox1: requiredTextInputIn('inBox1', 'box1') }, on);
      expect(exposed('form1').isValid).toBe(true);

      await act(async () => exposed('box1').setVisibility(true));
      await drain();

      expect(screen.getByRole('textbox')).toBeVisible();
      expect(exposed('form1').isValid).toBe(false);

      await clickSubmit();
      await drain();

      expect(count('formSubmits')).toBe(0);
      expect(count('formInvalids')).toBe(1);
    });
  });
});
