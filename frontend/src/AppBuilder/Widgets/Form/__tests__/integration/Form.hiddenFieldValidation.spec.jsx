/**
 * Form — a hidden child field does not block the Form.
 *
 * Form has no widget test contract yet (`widget-testing-manifest.json`:
 * not-started); this is a standalone regression spec until it is backfilled.
 *
 * Product rule: when the Form works out `isValid` and decides whether Submit
 * may fire `onSubmit`, it skips child fields that are hidden (`isVisible`
 * false). The hidden field keeps its own `isValid`; only the Form ignores it.
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
  name: 'Form skips hidden child fields when it validates',
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

const formDefinition = () =>
  componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{true}}'),
    showFooter: binding('{{true}}'),
    buttonToSubmit: binding('submit1'),
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

async function renderForm(fields) {
  seedApp(
    {
      form1: formDefinition(),
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

  test('a hidden empty required field does not block submit', async () => {
    // Break this catches: the Form counting a hidden field's isValid=false,
    // so the user is blocked by a field they cannot see or fill.
    await renderForm({ hidden1: requiredTextInput('hidden1', false) });
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
    await renderForm({ hidden1: requiredTextInput('hidden1', false), shown1: requiredTextInput('shown1', true) });

    await clickSubmit();
    await drain();

    expect(exposed('form1').isValid).toBe(false);
    expect(count('formSubmits')).toBe(0);
    expect(count('formInvalids')).toBe(1);
  });

  test('showing the hidden field again makes the Form count it', async () => {
    // Break this catches: deciding visibility once, so a field shown later
    // (here through its setVisibility action) is still skipped.
    await renderForm({ hidden1: requiredTextInput('hidden1', false) });
    expect(exposed('form1').isValid).toBe(true);

    await act(async () => exposed('hidden1').setVisibility(true));
    await drain();

    expect(exposed('form1').isValid).toBe(false);
  });
});
