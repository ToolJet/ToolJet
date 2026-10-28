import { screen, waitFor, within } from '@testing-library/react';
import { binding, createWidgetHarness, drain, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tree1';
const HANDLE = 'treeselect1';

const node = (label, value, children, state = {}) => ({
  label,
  value,
  visible: binding(state.visible === false ? '{{false}}' : '{{true}}'),
  disable: binding(state.disabled ? '{{true}}' : '{{false}}'),
  selected: binding(state.selected ? '{{true}}' : '{{false}}'),
  expanded: binding(state.expanded ? '{{true}}' : '{{false}}'),
  ...(children ? { children } : {}),
});

const TREE = [
  node('Root', 'root', [
    node('Branch', 'branch', [node('Leaf A', 'leaf-a'), node('Leaf B', 'leaf-b')]),
    node('Leaf C', 'leaf-c'),
  ]),
  node('Other', 'other'),
];

const defaults = {
  defaultProperties: {
    label: binding('Regions'),
    advanced: binding('{{true}}'),
    data: binding(TREE),
    allowIndependentSelection: binding('{{false}}'),
    checkedData: binding([]),
    expandedData: binding(['root', 'branch']),
    dynamicHeight: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    labelStyle: binding('new'),
    alignment: binding('side'),
    direction: binding('left'),
    autoLabelWidth: binding('{{true}}'),
    labelWidth: binding('33'),
    labelFontSize: binding('{{12}}'),
    labelColor: binding('#123456'),
    textColor: binding('#234567'),
    borderColor: binding('#345678'),
    uncheckedBackground: binding('#456789'),
    checkboxColor: binding('#56789a'),
    checkmarkColor: binding('#ffffff'),
    boxShadow: binding('1px 2px 3px 0px #000000'),
    padding: binding('default'),
  },
  widgetHeight: 320,
  widgetWidth: 360,
};

const tree = createWidgetHarness({
  componentType: 'TreeSelect',
  handle: HANDLE,
  id: ID,
  ...defaults,
});

const exposed = () => tree.exposed();
const widget = () => document.querySelector(`[data-cy="${HANDLE}"]`);
const row = (label) => screen.getByText(label).closest('li');
const checkbox = (label) => within(row(label)).getAllByRole('checkbox')[0];
const toggle = (label) => row(label).querySelector('.rct-collapse-btn');
const errorBoundary = () => document.querySelector('[data-cy="error-boundary-fallback"]');
const setProperty = (property, value, paramType = 'properties') =>
  tree.session.store.act(() => tree.setComponentProperty(ID, property, value, paramType));

const event = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: {
    eventId,
    actionId: 'set-custom-variable',
    key,
    value: `{{(variables.${key} || 0) + 1}}`,
  },
});

describe('TreeSelect widget', () => {
  beforeEach(() => tree.setup());
  afterEach(() => tree.teardown());

  test('[TreeSelect-DATA-001] static node flags drive initial state, visibility, and disabled interaction', async () => {
    // Break this catches: reading checkedData in static mode or dropping nested visible/disable/selected/expanded resolution.
    const staticTree = [
      node(
        'Static root',
        'static-root',
        [
          node('Enabled child', 'enabled'),
          node('Hidden child', 'hidden', null, { visible: false, selected: true }),
          node('Disabled child', 'disabled', null, { disabled: true }),
        ],
        { selected: true, expanded: true }
      ),
    ];
    tree.render({
      properties: {
        advanced: binding('{{false}}'),
        data: binding([node('Ignored dynamic node', 'ignored')]),
        options: binding(staticTree),
        checkedData: binding(['ignored']),
        expandedData: binding([]),
      },
    });

    // D-07: the selected parent's cascade skips its disabled child.
    await waitFor(() => expect(exposed().checked).toEqual(['static-root', 'enabled']));
    expect(exposed().expanded).toEqual(['static-root']);
    expect(screen.queryByText('Hidden child')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored dynamic node')).not.toBeInTheDocument();

    await tree.session.user.click(screen.getByText('Disabled child'));
    expect(exposed().checked).toEqual(['static-root', 'enabled']);

    await tree.session.user.click(screen.getByText('Enabled child'));
    await waitFor(() => expect(exposed().checked).toEqual([]));
  });

  test('[TreeSelect-SEL-001] cascade toggles descendants and publishes literal paths with exact events', async () => {
    // Break this catches: omitting ancestor/descendant updates or firing the specific/change event more than once per click.
    tree.render({
      events: [event('onCheck', 'checks'), event('onUnCheck', 'unchecks'), event('onChange', 'changes')],
    });
    await screen.findByText('Leaf A');

    await tree.session.user.click(screen.getByText('Branch'));
    await drain();
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));
    expect(exposed().checkedPathArray).toEqual([
      ['root', 'branch'],
      ['root', 'branch', 'leaf-a'],
      ['root', 'branch', 'leaf-b'],
    ]);
    expect(exposed().checkedPathStrings).toEqual(['root-branch', 'root-branch-leaf-a', 'root-branch-leaf-b']);
    expect(exposed().leafPathArray).toEqual([
      ['root', 'branch', 'leaf-a'],
      ['root', 'branch', 'leaf-b'],
    ]);
    expect(exposed().leafPathStrings).toEqual(['root-branch-leaf-a', 'root-branch-leaf-b']);
    expect(tree.variables()).toMatchObject({ checks: 1, changes: 1 });
    expect(tree.variables().unchecks).toBeUndefined();

    await tree.session.user.click(screen.getByText('Leaf A'));
    await drain();
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-b']));
    expect(checkbox('Branch')).not.toBeChecked();
    expect(checkbox('Branch').parentElement.lastElementChild).toHaveStyle({
      opacity: '1',
    });
    expect(tree.variables()).toMatchObject({
      checks: 1,
      unchecks: 1,
      changes: 2,
    });

    await tree.session.user.click(screen.getByText('Leaf A'));
    await drain();
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-b', 'leaf-a', 'branch']));
    expect(tree.variables()).toMatchObject({
      checks: 2,
      unchecks: 1,
      changes: 3,
    });
  });

  test('[TreeSelect-SEL-003] cascade check, uncheck, completion and checkedData skip disabled descendants', async () => {
    // Break this catches: cascading into disabled nodes or requiring disabled children before a parent counts as full.
    tree.render({
      currentMode: 'view',
      properties: {
        data: binding([
          node('Parent one', 'p1', [node('Enabled one', 'e1'), node('Disabled one', 'd1', null, { disabled: true })]),
          node('Parent two', 'p2', [node('Enabled two', 'e2'), node('Disabled two', 'd2', null, { disabled: true })]),
        ]),
        checkedData: binding(['p2', 'd2']),
        expandedData: binding(['p1', 'p2']),
      },
    });
    await screen.findByText('Disabled one');
    await waitFor(() => expect(exposed().checked).toEqual(['p2', 'e2', 'd2']));

    await tree.session.user.click(screen.getByText('Parent one'));
    await waitFor(() => expect(exposed().checked).toEqual(['p2', 'e2', 'd2', 'p1', 'e1']));
    expect(checkbox('Disabled one')).not.toBeChecked();
    expect(checkbox('Parent one')).toBeChecked();

    await tree.session.user.click(screen.getByText('Parent two'));
    await waitFor(() => expect(exposed().checked).toEqual(['d2', 'p1', 'e1']));
    expect(checkbox('Disabled two')).toBeChecked();

    await tree.session.user.click(screen.getByText('Parent one'));
    await waitFor(() => expect(exposed().checked).toEqual(['d2']));
    await tree.session.user.click(screen.getByText('Enabled one'));
    await waitFor(() => expect(exposed().checked).toEqual(['d2', 'e1', 'p1']));

    await setProperty('checkedData', ['p1']);
    await waitFor(() => expect(exposed().checked).toEqual(['p1', 'e1']));
    expect(checkbox('Disabled one')).not.toBeChecked();
  });

  test('[TreeSelect-SEL-002] independent mode changes only the actual target', async () => {
    // Break this catches: using cascade updates in independent mode or treating a parent's descendant-driven display state as selected.
    tree.render({
      properties: { allowIndependentSelection: binding('{{true}}') },
    });
    await screen.findByText('Leaf A');

    await tree.session.user.click(screen.getByText('Leaf A'));
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-a']));
    expect(checkbox('Root')).toBeChecked();
    expect(checkbox('Branch')).toBeChecked();
    expect(checkbox('Leaf B')).not.toBeChecked();

    await tree.session.user.click(screen.getByText('Branch'));
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-a', 'branch']));
    expect(exposed().checked).not.toContain('root');
    expect(exposed().checked).not.toContain('leaf-b');
  });

  test('[TreeSelect-DATA-002] property changes replace stale dynamic selection but unrelated updates do not', async () => {
    // Break this catches: syncing local checked state on every render or never syncing it after a real source change.
    tree.render({
      currentMode: 'view',
      properties: { checkedData: binding(['branch']) },
    });
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));

    await tree.act('selectOptions', ['other']);
    await waitFor(() => expect(exposed().checked).toEqual(['other']));
    await setProperty('label', 'Renamed');
    await setProperty('checkedData', ['branch']);
    await waitFor(() => expect(screen.getByText('Renamed')).toBeInTheDocument());
    expect(exposed().checked).toEqual(['other']);

    await setProperty('checkedData', ['root']);
    await waitFor(() => expect(exposed().checked).toEqual(['root', 'branch', 'leaf-a', 'leaf-b', 'leaf-c']));

    await setProperty('data', [node('Replacement', 'replacement')]);
    await waitFor(() => expect(screen.getByText('Replacement')).toBeInTheDocument());
    expect(exposed().checked).toEqual([]);
    expect(exposed().checkedPathArray).toEqual([]);
  });

  test('[TreeSelect-ACT-001] selection actions normalize scalar, array, subset, and null inputs', async () => {
    // Break this catches: iterating scalar input, using stale path maps, clearing everything on subset removal, or retaining null.
    tree.render();
    await screen.findByText('Root');

    await tree.act('selectOptions', 'leaf-a');
    expect(exposed()).toMatchObject({
      checked: ['leaf-a'],
      checkedPathArray: [['root', 'branch', 'leaf-a']],
      checkedPathStrings: ['root-branch-leaf-a'],
      leafPathArray: [['root', 'branch', 'leaf-a']],
      leafPathStrings: ['root-branch-leaf-a'],
    });

    // D-08: in cascading mode the selected parent adds its descendants; deselect stays exact.
    await tree.act('selectOptions', ['branch', 'leaf-a', 'other']);
    expect(exposed().checkedPathStrings).toEqual(['root-branch', 'root-branch-leaf-a', 'root-branch-leaf-b', 'other']);
    expect(exposed().leafPathStrings).toEqual(['root-branch-leaf-a', 'root-branch-leaf-b', 'other']);
    await tree.act('deselectOptions', ['branch', 'other']);
    expect(exposed().checked).toEqual(['leaf-a', 'leaf-b']);
    expect(exposed().checkedPathArray).toEqual([
      ['root', 'branch', 'leaf-a'],
      ['root', 'branch', 'leaf-b'],
    ]);

    await tree.act('deselectOptions');
    expect(exposed().checked).toEqual(['leaf-a', 'leaf-b']);
    await tree.act('selectOptions', null);
    expect(exposed()).toMatchObject({
      checked: [],
      checkedPathArray: [],
      checkedPathStrings: [],
      leafPathArray: [],
      leafPathStrings: [],
    });
  });

  test('[TreeSelect-ACT-003] selectOptions cascades like a click in cascading mode and stays exact in independent mode', async () => {
    // Break this catches: the action storing raw values without the cascade, or cascading into disabled nodes.
    tree.render({
      currentMode: 'view',
      properties: {
        data: binding([
          node('Root', 'root', [
            node('Branch', 'branch', [node('Leaf A', 'leaf-a'), node('Leaf B', 'leaf-b', null, { disabled: true })]),
            node('Leaf C', 'leaf-c'),
          ]),
        ]),
      },
    });
    await screen.findByText('Leaf B');

    await tree.act('selectOptions', 'branch');
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a']));
    expect(checkbox('Leaf A')).toBeChecked();
    expect(checkbox('Leaf B')).not.toBeChecked();
    expect(exposed().leafPathStrings).toEqual(['root-branch-leaf-a']);

    await tree.act('selectOptions', ['branch', 'leaf-c']);
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-c', 'root']));
    expect(checkbox('Root')).toBeChecked();

    await setProperty('allowIndependentSelection', true);
    await tree.act('selectOptions', 'branch');
    await waitFor(() => expect(exposed().checked).toEqual(['branch']));
  });

  test('[TreeSelect-ACT-002] selection actions publish paths from the replacement data tree', async () => {
    // Break this catches: action closures registered once that keep the initial tree's path and leaf maps.
    tree.render({ currentMode: 'view' });
    await screen.findByText('Root');

    await setProperty('data', [
      node('New top', 'new-top', [
        node('Middle', 'middle', [node('Replacement leaf', 'replacement-leaf'), node('Sibling leaf', 'sibling-leaf')]),
      ]),
    ]);
    await setProperty('expandedData', ['new-top', 'middle']);
    expect(await screen.findByText('Replacement leaf')).toBeInTheDocument();

    await tree.act('selectOptions', 'replacement-leaf');
    await waitFor(() =>
      expect(exposed()).toMatchObject({
        checked: ['replacement-leaf'],
        checkedPathArray: [['new-top', 'middle', 'replacement-leaf']],
        checkedPathStrings: ['new-top-middle-replacement-leaf'],
        leafPathArray: [['new-top', 'middle', 'replacement-leaf']],
        leafPathStrings: ['new-top-middle-replacement-leaf'],
      })
    );

    await tree.act('deselectOptions', 'replacement-leaf');
    await waitFor(() => expect(exposed().checked).toEqual([]));
    expect(exposed().checkedPathStrings).toEqual([]);
    expect(exposed().leafPathStrings).toEqual([]);
  });

  test('[TreeSelect-EXP-001] expansion interaction and expandedData both control the exposed value', async () => {
    // Break this catches: changing only the rendered branch or ignoring a controlled expandedData property update.
    tree.render({
      currentMode: 'view',
      properties: { expandedData: binding([]) },
    });
    await screen.findByText('Root');
    expect(exposed().expanded).toEqual([]);

    await tree.session.user.click(toggle('Root'));
    await waitFor(() => expect(exposed().expanded).toEqual(['root']));
    await tree.session.user.click(toggle('Root'));
    await waitFor(() => expect(exposed().expanded).toEqual([]));

    await setProperty('expandedData', ['root', 'branch']);
    await waitFor(() => expect(exposed().expanded).toEqual(['root', 'branch']));
    expect(screen.getByText('Leaf A')).toBeVisible();
  });

  test.each([
    {
      action: 'setVisibility',
      property: 'visibility',
      active: false,
      resetAction: true,
      propertyValue: false,
      exposedKey: 'isVisible',
      assertActive: () => expect(widget()).toHaveStyle({ display: 'none' }),
      assertProperty: () => expect(widget()).toHaveStyle({ display: 'none' }),
    },
    {
      action: 'setDisable',
      property: 'disabledState',
      active: true,
      resetAction: false,
      propertyValue: true,
      exposedKey: 'isDisabled',
      assertActive: () => expect(widget()).toHaveAttribute('aria-disabled', 'true'),
      assertProperty: () => expect(widget()).toHaveAttribute('aria-disabled', 'true'),
    },
    {
      action: 'setLoading',
      property: 'loadingState',
      active: true,
      resetAction: false,
      propertyValue: true,
      exposedKey: 'isLoading',
      assertActive: () => expect(screen.getByRole('status')).toBeInTheDocument(),
      assertProperty: () => expect(screen.getByRole('status')).toBeInTheDocument(),
    },
  ])(
    '[TreeSelect-STATE-001] $action survives no-op and unrelated updates, then yields to its property',
    async ({ action, property, active, resetAction, propertyValue, exposedKey, assertActive, assertProperty }) => {
      // Break this catches: resetting CSA-local state on any rerender or failing to resync it after a genuine property change.
      tree.render({ currentMode: 'view' });
      await screen.findByText('Root');

      await tree.act(action, active);
      await waitFor(() => expect(exposed()[exposedKey]).toBe(active));
      assertActive();

      await setProperty('label', `After ${action}`);
      await setProperty(property, property === 'visibility' ? true : false);
      await waitFor(() => expect(store().getResolvedComponent(ID).properties.label).toBe(`After ${action}`));
      expect(exposed()[exposedKey]).toBe(active);
      assertActive();

      await tree.act(action, resetAction);
      await waitFor(() => expect(exposed()[exposedKey]).toBe(resetAction));
      await setProperty(property, propertyValue);
      await waitFor(() => expect(exposed()[exposedKey]).toBe(propertyValue));
      assertProperty();
    }
  );

  test('[TreeSelect-VAL-001] selection bounds update exposed validity and interaction-only errors', async () => {
    // Break this catches: validating a non-array value, showing errors on mount, hiding them after interaction, or using exclusive bounds.
    tree.render({
      properties: {
        data: binding([node('One', 'one'), node('Two', 'two'), node('Three', 'three')]),
      },
      validation: {
        mandatory: binding('{{true}}'),
        minSelection: binding('{{2}}'),
        maxSelection: binding('{{2}}'),
      },
    });
    await screen.findByText('One');
    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    expect(screen.queryByText('Minimum 2 selections required')).not.toBeInTheDocument();

    await tree.session.user.click(screen.getByText('One'));
    expect(await screen.findByText('Minimum 2 selections required')).toBeInTheDocument();
    expect(exposed().isValid).toBe(false);

    await tree.session.user.click(screen.getByText('Two'));
    await waitFor(() => expect(exposed().isValid).toBe(true));
    expect(screen.queryByText('Minimum 2 selections required')).not.toBeInTheDocument();

    await tree.session.user.click(screen.getByText('Three'));
    expect(await screen.findByText('Maximum 2 selections allowed')).toBeInTheDocument();
    expect(exposed().isValid).toBe(false);
  });

  test('[TreeSelect-VAL-001] custom validation text is surfaced from the real validator', async () => {
    // Break this catches: dropping customRule from the TreeSelect validation object or swallowing its literal error.
    tree.render({
      properties: { data: binding([node('One', 'one')]) },
      validation: { customRule: binding('Pick a different region') },
    });

    await tree.session.user.click(await screen.findByText('One'));
    expect(await screen.findByText('Pick a different region')).toBeInTheDocument();
    expect(exposed().isValid).toBe(false);
  });

  test('[TreeSelect-VAL-002] selection actions recompute validity from their updated arrays', async () => {
    // Break this catches: imperative actions updating checked paths without validating the same updated selection.
    tree.render({
      properties: { data: binding([node('One', 'one'), node('Two', 'two')]) },
      validation: {
        mandatory: binding('{{true}}'),
        minSelection: binding('{{2}}'),
      },
    });
    await screen.findByText('One');
    await waitFor(() => expect(exposed().isValid).toBe(false));

    await tree.act('selectOptions', ['one', 'two']);
    expect(exposed().checked).toEqual(['one', 'two']);
    expect(exposed().isValid).toBe(true);

    await tree.act('deselectOptions', 'one');
    expect(exposed().checked).toEqual(['two']);
    expect(exposed().isValid).toBe(false);
  });

  test('[TreeSelect-FORM-001] Form clear removes checked paths and recomputes mandatory validity', async () => {
    // Break this catches: clearing only local visuals while leaving Form child paths or validity stale.
    tree.renderInsideForm({
      properties: { checkedData: binding(['leaf-a']) },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-a']));
    expect(exposed().leafPathStrings).toEqual(['root-branch-leaf-a']);

    await waitFor(() => expect(tree.exposed('form1').clearForm).toBeInstanceOf(Function));
    await tree.session.store.act(async () => tree.exposed('form1').clearForm());

    await waitFor(() => expect(exposed().checked).toEqual([]));
    expect(checkbox('Leaf A')).not.toBeChecked();
    expect(exposed()).toMatchObject({
      checkedPathArray: [],
      checkedPathStrings: [],
      leafPathArray: [],
      leafPathStrings: [],
      isValid: false,
    });
  });

  test('[TreeSelect-FORM-002] Form submission reveals an untouched TreeSelect validation error', async () => {
    // Break this catches: ignoring Form submit-attempt signals or showing the validation error before submission.
    tree.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await screen.findByText('Root');
    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await waitFor(() => expect(tree.exposed('form1').submitForm).toBeInstanceOf(Function));
    await tree.session.store.act(async () => tree.exposed('form1').submitForm());

    expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
    expect(exposed().checked).toEqual([]);
    expect(exposed().isValid).toBe(false);
  });

  test('[TreeSelect-FORM-003] Form formData carries the TreeSelect selection and follows later changes', async () => {
    // Break this catches: the Form value-key list not reading `checked`, leaving TreeSelect out of submitted data.
    tree.renderInsideForm();
    await screen.findByText('Leaf A');

    await tree.session.user.click(screen.getByText('Leaf A'));
    await waitFor(() => expect(tree.exposed('form1').data?.[HANDLE]?.checked).toEqual(['leaf-a']));
    await waitFor(() => expect(tree.exposed('form1').formData).toEqual({ [HANDLE]: ['leaf-a'] }));

    await tree.session.user.click(screen.getByText('Leaf B'));
    await waitFor(() => expect(tree.exposed('form1').formData).toEqual({ [HANDLE]: ['leaf-a', 'leaf-b', 'branch'] }));
  });

  test('[TreeSelect-RENDER-001] new label mode exposes associations, state, and registered inline styles', async () => {
    // Break this catches: disconnecting the label ID, dropping inline styles, or applying black option text in dark mode.
    tree.render({
      currentMode: 'view',
      darkMode: true,
      styles: {
        textColor: binding('#000'),
        padding: binding('none'),
        uncheckedBackground: binding('#abcdef'),
        borderColor: binding('#123456'),
        alignment: binding('side'),
        direction: binding('right'),
        autoLabelWidth: binding('{{false}}'),
        labelWidth: binding('40'),
        labelFontSize: binding('{{18}}'),
      },
    });
    await screen.findByText('Root');

    const label = screen.getByText('Regions').closest('label');
    expect(document.getElementById(label.getAttribute('for'))).not.toBeNull();
    expect(label).toHaveStyle({
      width: '40%',
      justifyContent: 'flex-end',
      fontSize: '18px',
    });
    expect(screen.getByText('Regions')).toHaveStyle({ color: '#123456' });
    expect(label.parentElement).toHaveClass('flex-row-reverse');
    expect(label.nextElementSibling).toHaveStyle({
      width: '60%',
      minWidth: '20%',
    });
    expect(widget()).toHaveStyle({
      color: '#fff',
      boxShadow: '1px 2px 3px 0px #000000',
    });
    expect(checkbox('Other')).toHaveStyle({
      backgroundColor: '#abcdef',
      border: '1px solid #123456',
    });
    expect(document.querySelector(`[data-cy="draggable-widget-${HANDLE}"]`)).toHaveStyle({ padding: '0px' });
    expect(exposed().id).toBe(ID);

    await tree.session.user.click(screen.getByText('Other'));
    expect(checkbox('Other')).toHaveStyle({
      backgroundColor: '#56789a',
      border: '1px solid transparent',
    });
    expect(checkbox('Other').parentElement.querySelector('svg path')).toHaveAttribute('fill', '#ffffff');
  });

  test('[TreeSelect-RENDER-001] legacy label mode renders the same selectable tree in viewer mode', async () => {
    // Break this catches: removing the saved-app legacy branch or accidentally making it editor-only.
    tree.render({
      currentMode: 'view',
      styles: { labelStyle: binding('legacy') },
    });
    await screen.findByText('Leaf A');
    expect(screen.getByText('Regions').closest('.card-title')).not.toBeNull();

    await tree.session.user.click(screen.getByText('Leaf A'));
    await waitFor(() => expect(exposed().checked).toEqual(['leaf-a']));
  });

  test('[TreeSelect-RENDER-002] top-aligned automatic label uses the full-width branch', async () => {
    // Break this catches: applying side/manual-width layout when top alignment and automatic label width are selected.
    tree.render({
      currentMode: 'view',
      styles: {
        alignment: binding('top'),
        direction: binding('left'),
        autoLabelWidth: binding('{{true}}'),
        labelWidth: binding('40'),
        labelFontSize: binding('{{16}}'),
      },
    });
    await screen.findByText('Root');

    const label = screen.getByText('Regions').closest('label');
    expect(document.getElementById(label.getAttribute('for'))).not.toBeNull();
    expect(label.parentElement).toHaveClass('flex-column');
    expect(label).toHaveStyle({ width: 'auto', fontSize: '16px', height: 'calc(16px + 8px)' });
    expect(label.nextElementSibling).toHaveStyle({ width: '100%' });
  });

  test('[TreeSelect-MODE-001] runtime mode changes rederive controlled selection and data source', async () => {
    // Break this catches: retaining cascaded descendants or dynamic nodes after their controlling mode property changes.
    tree.render({
      currentMode: 'view',
      properties: {
        checkedData: binding(['branch']),
        options: binding([node('Static only', 'static-only', null, { selected: true })]),
      },
    });
    await screen.findByText('Leaf A');
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));

    await setProperty('allowIndependentSelection', true);
    await waitFor(() => expect(exposed().checked).toEqual(['branch']));
    expect(checkbox('Branch')).toBeChecked();
    expect(checkbox('Leaf A')).not.toBeChecked();

    await setProperty('allowIndependentSelection', false);
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));

    await setProperty('advanced', false);
    expect(await screen.findByText('Static only')).toBeInTheDocument();
    expect(screen.queryByText('Root')).not.toBeInTheDocument();
    await waitFor(() => expect(exposed().checked).toEqual(['static-only']));
    expect(exposed().checkedPathStrings).toEqual(['static-only']);
  });

  test('[TreeSelect-STATE-002] global disabled state blocks node clicks and events until enabled', async () => {
    // Break this catches: conveying disabled only through ARIA while the custom label click handler stays active.
    tree.render({
      currentMode: 'view',
      properties: { disabledState: binding('{{true}}') },
      events: [event('onCheck', 'checks'), event('onUnCheck', 'unchecks'), event('onChange', 'changes')],
    });
    await screen.findByText('Leaf A');

    await tree.session.user.click(screen.getByText('Branch'));
    await drain();
    expect(exposed().checked).toEqual([]);
    expect(checkbox('Leaf A')).not.toBeChecked();
    expect(tree.variables().checks).toBeUndefined();
    expect(tree.variables().changes).toBeUndefined();

    await setProperty('disabledState', false);
    await waitFor(() => expect(exposed().isDisabled).toBe(false));
    await tree.session.user.click(screen.getByText('Branch'));
    await drain();
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));
    expect(tree.variables()).toMatchObject({ checks: 1, changes: 1 });
  });

  test.each([
    { via: 'property', disable: () => undefined, properties: { disabledState: binding('{{true}}') } },
    { via: 'setDisable', disable: () => tree.act('setDisable', true), properties: {} },
  ])(
    '[TreeSelect-STATE-003] disabled via $via blocks keyboard selection and expansion until enabled',
    async ({ via, disable, properties }) => {
      // Break this catches: leaving the expand button or node checkbox keyboard-operable while the widget is disabled.
      tree.render({
        currentMode: 'view',
        properties: { expandedData: binding(['root']), ...properties },
        events: [event('onCheck', 'checks'), event('onChange', 'changes')],
      });
      await screen.findByText('Branch');
      await disable();
      await waitFor(() => expect(exposed().isDisabled).toBe(true));

      toggle('Branch').focus();
      await tree.session.user.keyboard('{Enter}');
      await drain();
      expect(exposed().expanded).toEqual(['root']);
      expect(screen.queryByText('Leaf A')).not.toBeInTheDocument();
      checkbox('Branch').focus();
      await tree.session.user.keyboard(' ');
      await drain();
      expect(exposed().checked).toEqual([]);
      expect(checkbox('Branch')).not.toBeChecked();
      expect(tree.variables().checks).toBeUndefined();
      expect(tree.variables().changes).toBeUndefined();

      if (via === 'property') await setProperty('disabledState', false);
      else await tree.act('setDisable', false);
      await waitFor(() => expect(exposed().isDisabled).toBe(false));

      toggle('Branch').focus();
      await tree.session.user.keyboard('{Enter}');
      await waitFor(() => expect(exposed().expanded).toEqual(['root', 'branch']));
      checkbox('Branch').focus();
      await tree.session.user.keyboard(' ');
      await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));
      expect(tree.variables()).toMatchObject({ checks: 1, changes: 1 });
    }
  );

  test('[TreeSelect-DATA-003] non-array dynamic data renders an empty tree and clears stale state', async () => {
    // Break this catches: using the array-check result as a boolean so the raw object reaches half-check traversal.
    tree.render({ currentMode: 'view', properties: { checkedData: binding(['branch']) } });
    await waitFor(() => expect(exposed().checked).toEqual(['branch', 'leaf-a', 'leaf-b']));

    await setProperty('data', { label: 'Not a list', value: 'object' });
    await waitFor(() => expect(screen.queryByText('Leaf A')).not.toBeInTheDocument());
    expect(errorBoundary()).toBeNull();
    expect(widget()).not.toBeNull();
    expect(screen.queryByText('Not a list')).not.toBeInTheDocument();
    await waitFor(() => expect(exposed().checked).toEqual([]));
    expect(exposed().checkedPathArray).toEqual([]);
    expect(exposed().leafPathStrings).toEqual([]);

    // D-01: the Schema validation runs on resolution and logs the top-level type error.
    tree.render({ currentMode: 'view', properties: { data: binding({ label: 'Not a list', value: 'object' }) } });
    await waitFor(() => expect(widget()).not.toBeNull());
    await drain();
    const errors = store().debugger.logs.filter((entry) => entry.componentId === ID && entry.logLevel === 'error');
    expect(errors.map((entry) => entry.message)).toContain(
      'Expected a value of type array, but received {"label":"Not a list","value":"object"}'
    );
  });

  test.each([
    { mode: 'dynamic', key: 'data', advanced: '{{true}}' },
    { mode: 'static', key: 'options', advanced: '{{false}}' },
  ])(
    '[TreeSelect-DATA-005] $mode mode skips null, non-object and non-array-children entries',
    async ({ key, advanced }) => {
      // Break this catches: reading flags on a null entry or walking non-array children during render or cascade.
      const malformed = [
        null,
        'just text',
        node('Valid parent', 'valid', [node('Kid', 'kid')], { expanded: true }),
        { ...node('Odd kids', 'odd'), children: { label: 'Hidden object', value: 'hidden-object' } },
        { ...node('Text kids', 'text-kids'), children: 'abc' },
      ];
      tree.render({
        currentMode: 'view',
        properties: { advanced: binding(advanced), [key]: binding(malformed), expandedData: binding(['valid']) },
      });

      expect(await screen.findByText('Kid')).toBeInTheDocument();
      expect(errorBoundary()).toBeNull();
      expect(screen.getByText('Odd kids')).toBeInTheDocument();
      expect(screen.getByText('Text kids')).toBeInTheDocument();
      expect(screen.queryByText('Hidden object')).not.toBeInTheDocument();
      expect(screen.queryByText('just text')).not.toBeInTheDocument();

      await tree.session.user.click(screen.getByText('Valid parent'));
      await waitFor(() => expect(exposed().checked).toEqual(['valid', 'kid']));
      await tree.session.user.click(screen.getByText('Odd kids'));
      await waitFor(() => expect(exposed().checked).toEqual(['valid', 'kid', 'odd']));
      expect(exposed().leafPathStrings).toEqual(['valid-kid', 'odd']);
      await tree.session.user.click(screen.getByText('Valid parent'));
      await waitFor(() => expect(exposed().checked).toEqual(['odd']));
      expect(errorBoundary()).toBeNull();
      // D-01: only the top level is validated, so malformed entries never coerce the whole list to [].
      expect(
        store().debugger.logs.filter((entry) => entry.componentId === ID && entry.logLevel === 'error')
      ).toHaveLength(0);
    }
  );

  test('[TreeSelect-DATA-006] non-array static options render an empty tree without crashing', async () => {
    // Break this catches: normalizing only the dynamic branch so a static object reaches half-check traversal.
    tree.render({
      currentMode: 'view',
      properties: {
        advanced: binding('{{false}}'),
        options: binding([node('Static pick', 'static-pick', null, { selected: true })]),
      },
    });
    await waitFor(() => expect(exposed().checked).toEqual(['static-pick']));

    await setProperty('options', { label: 'Lonely', value: 'lonely' });
    await waitFor(() => expect(screen.queryByText('Static pick')).not.toBeInTheDocument());
    expect(errorBoundary()).toBeNull();
    expect(widget()).not.toBeNull();
    expect(screen.queryByText('Lonely')).not.toBeInTheDocument();
    await waitFor(() => expect(exposed().checked).toEqual([]));
    expect(exposed().checkedPathArray).toEqual([]);
  });

  test('[TreeSelect-DATA-004] duplicate values keep the first node and skip later duplicates with their subtrees', async () => {
    // Break this catches: passing duplicate values to the upstream tree, which throws, or keeping the later duplicate.
    tree.render({ currentMode: 'view' });
    await screen.findByText('Root');

    await setProperty('data', [
      node('Shop A', 'shop-a', [node('Store', 'store'), node('Till', 'till')]),
      node('Shop B', 'shop-b', [node('Store copy', 'store', [node('Deep', 'deep')]), node('Shelf', 'shelf')]),
    ]);
    await setProperty('expandedData', ['shop-a', 'shop-b']);
    expect(await screen.findByText('Shelf')).toBeInTheDocument();
    expect(errorBoundary()).toBeNull();
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.queryByText('Store copy')).not.toBeInTheDocument();
    expect(screen.queryByText('Deep')).not.toBeInTheDocument();

    await tree.session.user.click(screen.getByText('Shop B'));
    await waitFor(() => expect(exposed().checked).toEqual(['shop-b', 'shelf']));
    await tree.session.user.click(screen.getByText('Store'));
    await waitFor(() => expect(exposed().checked).toEqual(['shop-b', 'shelf', 'store']));
    expect(exposed().leafPathStrings).toEqual(['shop-b-shelf', 'shop-a-store']);
  });
});
