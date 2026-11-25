/**
 * Which fields a Form collects, controlled by its "Register nested fields"
 * toggle (`registerNestedFields`).
 *
 * With the toggle on, a field placed inside a layout container in the Form
 * (here a Container, including the Container's header slot) is one of the
 * Form's fields: it appears in the Form's `formData`. With the toggle off, only
 * the Form's direct children count, which is how every Form behaved before the
 * toggle existed. A nested Form is never looked through: its fields belong to
 * it, not to the outer Form.
 *
 * `formData` is keyed by component name and holds each collected field's value,
 * so it shows exactly which fields the Form picked up.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'form-nested-fields',
  name: 'Form collects fields nested in layout containers',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Form and Container render their bodies through AppCanvas/Container.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

/* ------------------------------------------------------------------ *
 * App builders
 * ------------------------------------------------------------------ */

function child(id, type, parent, properties = {}) {
  const def = componentDefinition(id, id, type, properties);
  def.component.parent = parent;
  def.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return def;
}

const form = (id, { registerNestedFields, parent } = {}) => {
  const def = componentDefinition(id, id, 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{false}}'),
    showFooter: binding('{{false}}'),
    buttonToSubmit: binding('none'),
    registerNestedFields: binding(registerNestedFields ? '{{true}}' : '{{false}}'),
  });
  if (parent) {
    def.component.parent = parent;
    def.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
  }
  return def;
};

const container = (id, parent, { showHeader = false } = {}) =>
  child(id, 'Container', parent, {
    showHeader: binding(showHeader ? '{{true}}' : '{{false}}'),
  });

const textInput = (id, parent, value) => child(id, 'TextInput', parent, { value: binding(value) });

let session;

function renderApp(components) {
  seedApp(components, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
}

const formData = (formId) => session.store.read((s) => s.getExposedValueOfComponent(formId, MODULE_ID))?.formData;

/* ------------------------------------------------------------------ *
 * Tests
 * ------------------------------------------------------------------ */

describe('Form: Register nested fields', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('with the toggle on, a field inside a Container in the Form is one of its fields', async () => {
    // Break this catches: the Form ignoring the toggle and collecting only its
    // direct children, so a field the author put in a Container is missing from
    // formData (and from data, children and isValid).
    renderApp({
      form1: form('form1', { registerNestedFields: true }),
      direct1: textInput('direct1', 'form1', 'alpha'),
      container1: container('container1', 'form1'),
      nested1: textInput('nested1', 'container1', 'beta'),
    });
    await drain();

    await waitFor(() => expect(formData('form1')).toEqual({ direct1: 'alpha', nested1: 'beta' }));
  });

  test('with the toggle off, only the Form’s direct children are its fields', async () => {
    // Break this catches: the Form descending into containers regardless of the
    // toggle, which changes what every existing Form (pinned off by the
    // backfill migration) submits.
    renderApp({
      form1: form('form1', { registerNestedFields: false }),
      direct1: textInput('direct1', 'form1', 'alpha'),
      container1: container('container1', 'form1'),
      nested1: textInput('nested1', 'container1', 'beta'),
    });
    await drain();

    await waitFor(() => expect(formData('form1')).toEqual({ direct1: 'alpha' }));
    // The nested field is mounted and has its value; the Form just doesn't collect it.
    expect(session.store.read((s) => s.getExposedValueOfComponent('nested1', MODULE_ID))?.value).toBe('beta');
  });

  test('with the toggle on, a field in a nested Container’s header slot is one of the Form’s fields', async () => {
    // Break this catches: the walk skipping a nested container's header/footer
    // sub-canvases (`<id>-header`), so a field placed in a Container's header is
    // left out of the Form.
    renderApp({
      form1: form('form1', { registerNestedFields: true }),
      container1: container('container1', 'form1', { showHeader: true }),
      headerField1: textInput('headerField1', 'container1-header', 'gamma'),
      nested1: textInput('nested1', 'container1', 'beta'),
    });
    await drain();

    await waitFor(() =>
      expect(formData('form1')).toEqual({
        headerField1: 'gamma',
        nested1: 'beta',
      })
    );
  });

  test('with the toggle on, the fields of a nested Form belong to that Form, not the outer one', async () => {
    // Break this catches: the walk looking through a nested Form, so the outer
    // Form also collects (and validates and submits) the inner Form's fields.
    renderApp({
      form1: form('form1', { registerNestedFields: true }),
      direct1: textInput('direct1', 'form1', 'alpha'),
      container1: container('container1', 'form1'),
      form2: form('form2', {
        registerNestedFields: true,
        parent: 'container1',
      }),
      inner1: textInput('inner1', 'form2', 'delta'),
    });
    await drain();

    await waitFor(() => expect(formData('form2')).toEqual({ inner1: 'delta' }));
    expect(formData('form1')).toEqual({ direct1: 'alpha' });
  });
});
