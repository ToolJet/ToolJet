import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Visibility / Disable for CodeEditor live in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityDisableTooltipForCodeEditor data migration), each with its CSA and exposed variable.

const ID = 'codeeditor1';

const widget = createWidgetHarness({
  componentType: 'CodeEditor',
  handle: ID,
  id: ID,
  defaultProperties: {
    enableLineNumber: binding('{{true}}'),
    mode: binding('javascript'),
    placeholder: binding(''),
    dynamicHeight: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    borderRadius: binding('{{6}}'),
    borderColor: binding('var(--cc-weak-border)'),
    backgroundColor: binding('var(--cc-surface1-surface)'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector(`[data-cy="${ID}"]`);
const editable = () => root()?.querySelector('.cm-content')?.getAttribute('contenteditable');
const mounted = () => waitFor(() => expect(root()?.querySelector('.cm-content')).toBeTruthy());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

describe('CodeEditor widget: additional actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[CodeEditor-VIS-001] visibility=false in properties hides the editor', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await mounted();

    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[CodeEditor-DIS-001] disabledState=true in properties makes the editor read-only', async () => {
    // Break this catches: still reading disabledState from styles after it moved to properties.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await mounted();

    expect(root()).toHaveAttribute('data-disabled', 'true');
    expect(editable()).toBe('false');
  });

  test('[CodeEditor-CSA-001] setVisibility hides and restores the editor and publishes isVisible', async () => {
    // Break this catches: the CSA not being registered on mount, or toggling the DOM without publishing isVisible.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isVisible: true }));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
    expect(exposed()).toMatchObject({ isVisible: false });

    await widget.act('setVisibility', true);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'block' }));
    expect(exposed()).toMatchObject({ isVisible: true });
  });

  test('[CodeEditor-CSA-002] setDisable toggles read-only editing and publishes isDisabled', async () => {
    // Break this catches: the CSA not being registered, or the editor staying editable while disabled.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: false }));
    expect(editable()).toBe('true');

    await widget.act('setDisable', true);
    await waitFor(() => expect(editable()).toBe('false'));
    expect(root()).toHaveAttribute('data-disabled', 'true');
    expect(exposed()).toMatchObject({ isDisabled: true });

    await widget.act('setDisable', false);
    await waitFor(() => expect(editable()).toBe('true'));
    expect(exposed()).toMatchObject({ isDisabled: false });
  });

  test('[CodeEditor-CSA-003] changed visibility/disabledState properties override earlier CSA calls', async () => {
    // Break this catches: local CSA state no longer yielding to a later change of the owning property.
    widget.render({});
    await mounted();

    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);
    await setProperty('visibility', '{{false}}');
    await setProperty('disabledState', '{{true}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('disabledState', '{{false}}');

    await waitFor(() => expect(root()).toHaveStyle({ display: 'block' }));
    expect(editable()).toBe('true');
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false });
  });

  test('[CodeEditor-TIP-001] a tooltip set under properties is shown on hover', async () => {
    // Break this catches: RenderWidget still reading CodeEditor's tooltip from `general`.
    widget.render({ properties: { tooltip: binding('Paste your query here') } });
    await mounted();

    await widget.session.user.hover(root());
    await waitFor(() => expect(screen.getAllByText('Paste your query here').length).toBeGreaterThan(0));
  });
});
