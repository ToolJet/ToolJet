/**
 * MultiselectV2 — inside a Form, its four events, and the two unvalidated keys.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-FORM-* and MultiselectV2-EVT-*; the SAVED-*
 * scenarios live in MultiselectV2.savedApps.spec.jsx).
 *
 * The Form cases build their own tree rather than using the shared harness's
 * `renderInsideForm`: three of them need a Form property that helper does not
 * seed (`validateOnSubmit`), and FORM-005 needs the child to mount AFTER the
 * Form has been cleared — which is the whole point of that scenario, and
 * impossible when the child goes up with the Form.
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { createMultiselectHarness, DEFAULT_PROPERTIES, DEFAULT_STYLES } from './multiselectV2Harness';

const harness = createMultiselectHarness();
const state = () => useStore.getState();

const countEvent = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: 'ms1',
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const focusAndBlurCounters = () => [countEvent('onFocus', 'focusCount'), countEvent('onBlur', 'blurCount')];
const count = (key) => state().getVariable(key, 'canvas') ?? 0;

const rowLabels = () => screen.queryAllByRole('option').map((r) => r.textContent);
const searchBox = () => screen.queryByPlaceholderText('Search');
const isMenuOpen = () => screen.queryAllByRole('option').length > 0 || searchBox() !== null;
const valueSummary = () => document.querySelector('#options');
const portaledMenu = () => document.querySelector('#dropdown-multiselect-widget-custom-menu-list-ms1');
/** The field's leading icon. `TablerIcon` lazy-imports the whole icon set, so
 *  it renders a sized placeholder span first and the real svg only after that
 *  dynamic import settles — hence the `waitFor` at every call site. */
const fieldIcon = () => document.querySelector('.multiselect-widget svg.tabler-icon');

const control = () => screen.getByRole('combobox');
async function openMenu() {
  await harness.session.user.click(control());
  await drain();
}
const clickRow = async (text) => {
  const found = screen.getAllByRole('option').find((r) => r.textContent.startsWith(text));
  if (!found) throw new Error(`no option row rendering "${text}" (rows: ${JSON.stringify(rowLabels())})`);
  await harness.session.user.click(found);
  await drain();
};

/* ------------------------------------------------------------------ *
 * A Form hosting this widget, with control over the Form's own props
 * and over whether the child is present at first paint.
 * ------------------------------------------------------------------ */
const FORM_SCENARIO = defineAppBuilderScenario({
  id: 'multiselectv2-in-form',
  name: 'MultiselectV2 inside a Form',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Form renders through AppCanvas/Container, which needs the real
  // provider. view: WidgetWrapper's editor-only ConfigHandle cannot mount here.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

let formSession;
let restoreOffsetHeight;

function formChild({ properties = {}, validation = {} } = {}) {
  const child = componentDefinition('ms1', 'multiselect1', 'MultiselectV2', { ...DEFAULT_PROPERTIES, ...properties });
  child.component.parent = 'form1';
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.component.definition.styles = { ...DEFAULT_STYLES };
  child.component.definition.validation = { mandatory: binding(false), customRule: binding(null), ...validation };
  return child;
}

function renderForm({ properties, validation, withChild = true, formProperties = {} } = {}) {
  const form = componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    ...formProperties,
  });
  const components = { form1: form, ...(withChild ? { ms1: formChild({ properties, validation }) } : {}) };
  seedApp(components, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return formSession.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
}

/** Adds the MultiselectV2 child to an already-rendered Form. */
function addChildToForm({ properties, validation } = {}) {
  const form = state().getComponentDefinition('form1', MODULE_ID);
  seedApp(
    { form1: { ...form, id: 'form1', name: 'form1' }, ms1: formChild({ properties, validation }) },
    {
      moduleId: MODULE_ID,
    }
  );
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return formSession.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
}

const formExposed = () => state().getExposedValueOfComponent('form1', MODULE_ID);
const childExposed = () => state().getExposedValueOfComponent('ms1', MODULE_ID);

async function callForm(action) {
  await formSession.store.act(async () => {
    await formExposed()[action]();
  });
  await drain();
}

const EMPTY_SELECTION = { values: binding('{{[]}}') };
const MANDATORY = { mandatory: binding(true) };

describe('MultiselectV2 inside a Form', () => {
  beforeEach(() => {
    // The virtualized menu needs a measurable viewport; see multiselectV2Harness.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 300 });
    restoreOffsetHeight = () => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor);
    formSession = new AppBuilderTestSession({ scenario: FORM_SCENARIO });
  });
  afterEach(() => restoreOffsetHeight?.());

  test('[MultiselectV2-FORM-001] A Form submit reveals the error on a field the user never touched', async () => {
    // Break this catches: dropping the `useShowValidationOnFormSubmit`
    // subscription (MultiselectV2.jsx:86) — a required field the user skipped
    // would stay silent through submit after submit.
    renderForm({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await callForm('submitForm');

    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
  });

  test('[MultiselectV2-FORM-002] A Form clear empties the field and republishes its variables', async () => {
    // Break this catches: dropping the `useFormClear` subscription
    // (MultiselectV2.jsx:406) — the Form would report itself cleared while this
    // field kept the user's selection and its stale exposed variables.
    renderForm({ properties: { values: binding("{{['1','2']}}") }, validation: MANDATORY });
    await drain();
    expect(childExposed().values).toEqual(['1', '2']);

    await callForm('clearForm');

    expect(childExposed().values).toEqual([]);
    expect(childExposed().selectedOptions).toEqual([]);
    expect(childExposed().isValid).toBe(false);
    expect(valueSummary()).toBeNull();
  });

  test("[MultiselectV2-FORM-003] The Form reads this field's `values`, and an invalid field invalidates the Form", async () => {
    // Break this catches: renaming the exposed `values` key
    // (MultiselectV2.jsx:392) or dropping `isValid` from it — the Form gathers
    // children by those exact names (Form.jsx:341-379), so either rename
    // silently empties `formData` or makes an invalid form submittable.
    renderForm({ properties: { values: binding("{{['1','3']}}") } });
    await drain();

    expect(formExposed().formData).toEqual({ multiselect1: ['1', '3'] });
    expect(formExposed().isValid).toBe(true);

    formSession.render(<></>);
    renderForm({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();

    expect(formExposed().formData).toEqual({ multiselect1: [] });
    expect(formExposed().isValid).toBe(false);
  });

  test('[MultiselectV2-FORM-004] A Form clear does not restore the configured default selection', async () => {
    // Break this catches: pointing `useFormClear` at the default derivation
    // instead of `setInputValue([])` (MultiselectV2.jsx:406) — a form reset
    // would look like it worked while quietly refilling this field.
    renderForm({ properties: { values: binding("{{['1','2']}}") }, validation: MANDATORY });
    await drain();

    await callForm('clearForm');

    expect(childExposed().values).toEqual([]);
    expect(childExposed().isValid).toBe(false);
  });

  test('[MultiselectV2-FORM-005] A field added after a Form clear keeps its default selection', async () => {
    // Break this catches: removing the mount-time `clearCount` snapshot
    // (Form/FormSignalContext.tsx:23-25) — every field dropped onto a Form that
    // has ever been cleared would wipe its own defaults on mount.
    renderForm({ withChild: false });
    await drain();

    await callForm('clearForm');

    addChildToForm({ properties: { values: binding("{{['2']}}") } });
    await drain();

    expect(childExposed().values).toEqual(['2']);
  });

  test('[MultiselectV2-FORM-006] A Form submit does not reveal the error on a hidden field', async () => {
    // Break this catches: dropping `visibility` from the error row's gate
    // (MultiselectV2.jsx:656). Today a hidden required field blocks the Form
    // with nothing on screen to explain it — this pins both halves.
    renderForm({
      properties: { ...EMPTY_SELECTION, visibility: binding('{{false}}') },
      validation: MANDATORY,
    });
    await drain();

    await callForm('submitForm');

    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
    expect(formExposed().isValid).toBe(false);
  });
});

describe('MultiselectV2: focus and blur events', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-EVT-001] Clicking the closed control opens the menu and fires `onFocus`', async () => {
    // Break this catches: `handleClickInsideSelect` firing `onFocus` on both
    // branches (MultiselectV2.jsx:371-386), or the `onTouchEnd` handler firing
    // a second time alongside the click — the count would read 2.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();

    await openMenu();

    expect(isMenuOpen()).toBe(true);
    expect(count('focusCount')).toBe(1);
    expect(count('blurCount')).toBe(0);
  });

  test('[MultiselectV2-EVT-002] Clicking the open control closes the menu and fires `onBlur`', async () => {
    // Break this catches: the close branch not clearing `searchInputValue`
    // (MultiselectV2.jsx:377) — a reopened menu would come back pre-filtered by
    // a term the user can no longer see — or the document-level outside
    // handler firing `onBlur` a second time for the same click.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();
    await openMenu();
    await harness.session.user.type(searchBox(), 'opt');
    await drain();

    await harness.session.user.click(control());
    await drain();

    expect(isMenuOpen()).toBe(false);
    expect(count('blurCount')).toBe(1);

    await openMenu();
    expect(searchBox()).toHaveValue('');
    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
  });

  test('[MultiselectV2-EVT-003] Enter opens the menu, Escape closes it, and Escape on a closed field does nothing', async () => {
    // Break this catches: dropping the `!isMultiselectOpen` guard from the
    // Enter branch or the `isMultiselectOpen` guard from the Escape branch
    // (MultiselectV2.jsx:629-638) — Escape on a closed field would fire a
    // phantom `onBlur`, which the final count below is what catches.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();

    fireEvent.keyDown(control(), { key: 'Enter' });
    await drain();
    expect(isMenuOpen()).toBe(true);
    expect(count('focusCount')).toBe(1);

    fireEvent.keyDown(control(), { key: 'Escape' });
    await drain();
    expect(isMenuOpen()).toBe(false);
    expect(count('blurCount')).toBe(1);

    fireEvent.keyDown(control(), { key: 'Escape' });
    await drain();
    expect(count('blurCount')).toBe(1);
    expect(count('focusCount')).toBe(1);
  });

  test('[MultiselectV2-EVT-004] A click outside the field and its menu closes the field and fires `onBlur`', async () => {
    // Break this catches: dropping the document `mousedown` listener or its
    // `capture: true` (MultiselectV2.jsx:408-413) — the menu would stay open
    // over whatever the user clicked next.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();
    await openMenu();
    await harness.session.user.type(searchBox(), 'opt');
    await drain();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fireEvent.mouseDown(outside);
    await drain();

    expect(isMenuOpen()).toBe(false);
    expect(count('blurCount')).toBe(1);

    await openMenu();
    expect(searchBox()).toHaveValue('');
    outside.remove();
  });

  test('[MultiselectV2-EVT-005] A click inside the menu neither closes it nor fires `onBlur`', async () => {
    // Break this catches: dropping the `!menu.contains(event.target)` term
    // (MultiselectV2.jsx:365-367). The menu is portaled to `document.body`, so
    // without that explicit containment test every click on an option row
    // would read as a click outside the widget and close the menu.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();
    await openMenu();

    fireEvent.mouseDown(portaledMenu());
    await drain();
    expect(isMenuOpen()).toBe(true);

    await clickRow('option1');
    expect(isMenuOpen()).toBe(true);
    expect(count('blurCount')).toBe(0);
  });

  test('[MultiselectV2-EVT-006] Tabbing away from the field fires nothing', async () => {
    // Break this catches: wiring `onFocus`/`onBlur` to react-select's own focus
    // props instead of to the menu's open state (MultiselectV2.jsx:371-386).
    // That is arguably the fix — the events are named for focus — but it would
    // change what every existing handler observes, so this pins today's
    // behaviour: a keyboard user who tabs out triggers nothing at all.
    harness.render({ properties: EMPTY_SELECTION, events: focusAndBlurCounters() });
    await drain();

    control().focus();
    await harness.session.user.tab();
    await drain();

    expect(count('focusCount')).toBe(0);
    expect(count('blurCount')).toBe(0);
    expect(harness.exposed().values).toEqual([]);
  });

  test('[MultiselectV2-EVT-007] A disabled or loading field opens nothing and fires nothing', async () => {
    // Break this catches: moving the disabled/loading guard below the
    // open/close branches in `handleClickInsideSelect` (MultiselectV2.jsx:373)
    // — the menu would stay shut but the events would fire anyway, which is
    // worse than either failure alone.
    harness.render({
      properties: { ...EMPTY_SELECTION, disabledState: binding('{{true}}') },
      events: focusAndBlurCounters(),
    });
    await drain();
    fireEvent.click(control());
    await drain();
    expect(isMenuOpen()).toBe(false);
    expect(count('focusCount')).toBe(0);
    expect(count('blurCount')).toBe(0);

    harness.render({
      properties: { ...EMPTY_SELECTION, disabledState: binding('{{false}}'), loadingState: binding('{{true}}') },
      events: focusAndBlurCounters(),
    });
    await drain();
    fireEvent.click(control());
    await drain();
    expect(isMenuOpen()).toBe(false);
    expect(count('focusCount')).toBe(0);
    expect(count('blurCount')).toBe(0);
  });
});
