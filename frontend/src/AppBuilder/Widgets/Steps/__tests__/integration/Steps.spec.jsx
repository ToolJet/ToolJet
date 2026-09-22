/**
 * Steps behaviour spec, run through the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/Steps/TESTING.md`.
 * This is characterization-only: production changes are forbidden.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { stepsConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/steps';
import { stepsConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/steps';
import { componentDefinition } from '@/test/app-builder';
import {
  binding,
  createWidgetHarness,
  MODULE_ID,
  store,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'steps1';
const HANDLE = 'steps1';
const ID2 = 'steps2';
const HANDLE2 = 'steps2';

const staticSteps = (rows) => ({ value: rows });
const step = (id, name, extras = {}) => ({ id, name, tooltip: '', ...extras });
const BASE_STEPS = [step(1, 'Plan'), step(2, 'Build'), step(3, 'Ship')];

const defaultProperties = {
  variant: binding('titles'),
  schema: binding("{{[{id:10,name:'Dynamic A'},{id:20,name:'Dynamic B'}]}}"),
  steps: staticSteps(BASE_STEPS),
  stepsSelectable: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  advanced: binding('{{false}}'),
  currentStep: binding('{{2}}'),
};

const defaultStyles = {
  incompletedAccent: binding('#ccd1d5'),
  incompletedLabel: binding('#111111'),
  completedAccent: binding('#2244aa'),
  completedLabel: binding('#222222'),
  currentStepLabel: binding('#333333'),
  padding: binding('default'),
  boxShadow: binding('0px 0px 0px 0px rgba(0, 0, 0, 0)'),
};

const widget = createWidgetHarness({
  componentType: 'Steps',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
  widgetHeight: 80,
  widgetWidth: 500,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) =>
  container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const milestones = (container, handle = HANDLE) => Array.from(root(container, handle).querySelectorAll('.milestone'));
const milestone = (container, index, handle = HANDLE) => milestones(container, handle)[index];
const labels = (container, handle = HANDLE) =>
  Array.from(root(container, handle).querySelectorAll('.label span')).map((node) => node.textContent);
const activeMilestones = (container, handle = HANDLE) =>
  root(container, handle).querySelectorAll('.milestone.active');

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}

async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'styles'));
}

const selectEvents = (sourceId = ID, handle = HANDLE, prefix = '') => [
  {
    id: `${prefix}select-count`,
    index: 0,
    sourceId,
    name: `${prefix}count selects`,
    target: 'component',
    event: {
      eventId: 'onSelect',
      actionId: 'set-custom-variable',
      key: `${prefix}selectCount`,
      value: `{{(variables.${prefix}selectCount ?? 0) + 1}}`,
    },
  },
  {
    id: `${prefix}select-value`,
    index: 1,
    sourceId,
    name: `${prefix}capture selected id`,
    target: 'component',
    event: {
      eventId: 'onSelect',
      actionId: 'set-custom-variable',
      key: `${prefix}selectedAtEvent`,
      value: `{{components.${handle}.currentStepId}}`,
    },
  },
];

function stepsDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, 'Steps', { ...defaultProperties, ...properties });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

describe('Steps widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Steps-OPT-001] dynamic and static modes use only their active source', async () => {
    // Break this catches: resolving the inactive list, or failing to replace the published list when mode changes.
    const { container } = widget.render();
    await waitFor(() => expect(labels(container)).toEqual(['Plan', 'Build', 'Ship']));
    expect(widget.exposed().steps.map(({ id }) => id)).toEqual([1, 2, 3]);

    await setProperty('schema', "{{[{id:30,name:'Ignored dynamic'}]}}");
    expect(labels(container)).toEqual(['Plan', 'Build', 'Ship']);

    const stableCanvas = canvasNode(container);
    await setProperty('advanced', '{{true}}');
    await waitFor(() => expect(labels(container)).toEqual(['Ignored dynamic']));
    expect(widget.exposed().steps.map(({ id }) => id)).toEqual([30]);
    expect(canvasNode(container)).toBe(stableCanvas);

    await setProperty('steps', [step(40, 'Ignored static')]);
    expect(labels(container)).toEqual(['Ignored dynamic']);
  });

  test('[Steps-OPT-002] sources are cloned, defaulted, filtered, and invalid non-arrays become empty', async () => {
    // Break this catches: mutating authored rows, overwriting explicit false, or filtering hidden rows out of exposed state.
    const authored = [
      Object.freeze({ id: 1, name: 'Defaulted' }),
      Object.freeze({ id: 2, name: 'Hidden', visible: false }),
      Object.freeze({ id: 3, name: 'Explicit', visible: true, disabled: false }),
    ];
    Object.freeze(authored);
    const { container } = widget.render({ properties: { steps: staticSteps(authored) } });

    await waitFor(() => expect(labels(container)).toEqual(['Defaulted', 'Explicit']));
    expect(widget.exposed().steps).toEqual([
      { id: 1, name: 'Defaulted', visible: true, disabled: false },
      { id: 2, name: 'Hidden', visible: false, disabled: false },
      { id: 3, name: 'Explicit', visible: true, disabled: false },
    ]);
    expect(authored).toEqual([
      { id: 1, name: 'Defaulted' },
      { id: 2, name: 'Hidden', visible: false },
      { id: 3, name: 'Explicit', visible: true, disabled: false },
    ]);

    for (const invalid of [{ nope: true }, null, 7, false]) {
      await setProperty('steps', invalid);
      await waitFor(() => expect(milestones(container)).toHaveLength(0));
      expect(widget.exposed().steps).toEqual([]);
    }
  });

  test('[Steps-REN-001] variants keep one positional active/completed model across live changes', async () => {
    // Break this catches: comparing IDs to positions, rendering the wrong variant payload, or leaving two active milestones.
    const { container } = widget.render();
    await waitFor(() => expect(labels(container)).toEqual(['Plan', 'Build', 'Ship']));
    expect(milestone(container, 0)).toHaveClass('completed');
    expect(milestone(container, 1)).toHaveClass('active');
    expect(milestone(container, 2)).toHaveClass('incomplete');
    expect(activeMilestones(container)).toHaveLength(1);

    await setProperty('variant', 'numbers');
    await waitFor(() => expect(milestones(container).map((node) => node.textContent.trim())).toEqual(['1', '2', '3']));
    expect(activeMilestones(container)).toHaveLength(1);

    await setProperty('currentStep', '{{3}}');
    await waitFor(() => expect(milestone(container, 2)).toHaveClass('active'));
    expect(milestone(container, 1)).toHaveClass('completed');
    expect(widget.exposed().currentStepId).toBe(3);

    await setProperty('variant', 'plain');
    await waitFor(() => expect(labels(container)).toEqual([]));
    expect(milestones(container).every((node) => node.textContent.trim() === '')).toBe(true);
    expect(activeMilestones(container)).toHaveLength(1);
  });

  test('[Steps-SEL-001] allowed pointer selection publishes before exactly one select event', async () => {
    // Break this catches: firing before the exposed write, firing twice, or selecting the wrong milestone.
    const { container } = widget.render({ events: selectEvents() });
    await widget.session.user.click(milestone(container, 2));

    await waitFor(() => expect(widget.variables().selectCount).toBe(1));
    expect(widget.variables().selectedAtEvent).toBe(3);
    expect(widget.exposed().currentStepId).toBe(3);
    expect(milestone(container, 2)).toHaveClass('active');
    expect(activeMilestones(container)).toHaveLength(1);
  });

  test('[Steps-SEL-002] every selection gate blocks both state and event, and can be restored', async () => {
    // Break this catches: checking only one gate, or suppressing the event while still changing currentStepId.
    const { container } = widget.render({ events: selectEvents() });
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(2));

    await setProperty('stepsSelectable', '{{false}}');
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);

    await setProperty('stepsSelectable', '{{true}}');
    await widget.act('setStepDisable', 3, true);
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);

    await widget.act('setStepDisable', 3, false);
    await setProperty('disabledState', '{{true}}');
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);

    await setProperty('disabledState', '{{false}}');
    await widget.act('setDisabled', true);
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);
    expect(widget.variables().selectCount).toBeUndefined();

    await widget.act('setDisabled', false);
    await widget.session.user.click(milestone(container, 2));
    await waitFor(() => expect(widget.variables().selectCount).toBe(1));
    expect(widget.exposed().currentStepId).toBe(3);
  });

  test('[Steps-CSA-001] setStep follows the approved target and disabled policy without events', async () => {
    // Break this catches: validating target membership/local disabled state, or firing onSelect from a programmatic change.
    const { container } = widget.render({ events: selectEvents() });

    for (const requested of [1, 99]) {
      await widget.act('setStep', requested);
      await waitFor(() => expect(widget.exposed().currentStepId).toBe(requested));
    }
    expect(activeMilestones(container)).toHaveLength(0);

    await widget.act('setDisabled', true);
    await widget.act('setStep', 3);
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(3));

    await setProperty('disabledState', '{{true}}');
    await widget.act('setDisabled', false);
    await widget.act('setStep', 1);
    expect(widget.exposed().currentStepId).toBe(3);
    expect(widget.variables().selectCount).toBeUndefined();
  });

  test('[Steps-CSA-002] setStepVisible loosely matches one row and preserves a hidden active id', async () => {
    // Break this catches: strict ID comparison, selecting a fallback after hide, firing an event, or changing a missing target.
    const { container } = widget.render({ events: selectEvents() });
    await widget.act('setStepVisible', '2', false);

    await waitFor(() => expect(labels(container)).toEqual(['Plan', 'Ship']));
    expect(widget.exposed().steps.find(({ id }) => id === 2).visible).toBe(false);
    expect(widget.exposed().currentStepId).toBe(2);
    expect(activeMilestones(container)).toHaveLength(0);

    const before = widget.exposed().steps;
    await widget.act('setStepVisible', 'missing', false);
    expect(widget.exposed().steps).toEqual(before);
    expect(widget.variables().selectCount).toBeUndefined();
  });

  test('[Steps-CSA-003] setStepDisable changes only its loose-match target and interaction', async () => {
    // Break this catches: updating every row, strict ID matching, or leaving a disabled target pointer-selectable.
    const { container } = widget.render({ events: selectEvents() });
    await widget.act('setStepDisable', '3', true);

    expect(widget.exposed().steps.map(({ disabled }) => disabled)).toEqual([false, false, true]);
    expect(milestone(container, 2)).toHaveClass('disabled');
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);
    expect(widget.variables().selectCount).toBeUndefined();

    await widget.act('setStepDisable', 999, true);
    expect(widget.exposed().steps.map(({ disabled }) => disabled)).toEqual([false, false, true]);
    await widget.act('setStepDisable', 3, false);
    await widget.session.user.click(milestone(container, 2));
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(3));
    expect(widget.variables().selectCount).toBe(1);
  });

  test('[Steps-CSA-004] resetSteps chooses the first visible step or undefined without an event', async () => {
    // Break this catches: resetting to configured currentStep, keeping a hidden current ID, or emitting a select event.
    const { container } = widget.render({ events: selectEvents() });
    await widget.act('setStepVisible', 1, false);
    await widget.act('resetSteps');
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(2));
    expect(milestone(container, 0)).toHaveClass('active');

    await widget.act('setStepVisible', 2, false);
    await widget.act('setStepVisible', 3, false);
    await widget.act('resetSteps');
    await waitFor(() => expect(widget.exposed().currentStepId).toBeUndefined());
    expect(activeMilestones(container)).toHaveLength(0);
    expect(widget.variables().selectCount).toBeUndefined();
  });

  test('[Steps-STA-001] visibility and disabled actions coerce, publish, and render the approved split state', async () => {
    // Break this catches: publishing raw values, failing to repaint, or incorrectly coupling local disabled state to aria-disabled.
    const { container } = widget.render({ events: selectEvents() });

    await widget.act('setVisibility', 0);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveStyle({ display: 'none' });
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    await widget.act('setVisibility', 'visible');
    expect(widget.exposed().isVisible).toBe(true);

    await widget.act('setDisabled', { yes: true });
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveClass('disabled');
    expect(canvasNode(container)).toHaveClass('disabled');
    expect(root(container)).toHaveAttribute('aria-disabled', 'false');
    await widget.session.user.click(milestone(container, 2));
    expect(widget.exposed().currentStepId).toBe(2);

    await widget.act('setDisabled', null);
    expect(widget.exposed().isDisabled).toBe(false);
    expect(root(container)).not.toHaveClass('disabled');
    expect(canvasNode(container)).not.toHaveClass('disabled');
    expect(widget.variables().selectCount).toBeUndefined();
  });

  test('[Steps-STA-002] state actions survive non-changes and yield to changed owning properties', async () => {
    // Break this catches: unrelated/no-op resolution wiping CSA state, or property changes never regaining ownership.
    const { container } = widget.render();

    await widget.act('setVisibility', false);
    await setProperty('visibility', '{{true}}');
    await setProperty('variant', 'numbers');
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveStyle({ display: 'none' });
    await widget.act('setVisibility', true);
    await setProperty('visibility', '{{false}}');
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));

    await widget.act('setDisabled', true);
    await setProperty('disabledState', '{{false}}');
    await setProperty('variant', 'plain');
    expect(widget.exposed().isDisabled).toBe(true);
    await widget.act('setDisabled', false);
    await setProperty('disabledState', '{{true}}');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(root(container)).toHaveClass('disabled');
  });

  test('[Steps-STA-003] current-step action state yields only to a changed currentStep property', async () => {
    // Break this catches: unrelated/no-op resolution undoing selection, or a changed currentStep failing to take control.
    const { container } = widget.render({ events: selectEvents() });
    await widget.session.user.click(milestone(container, 2));
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(3));

    await setProperty('variant', 'numbers');
    await setProperty('currentStep', '{{2}}');
    expect(widget.exposed().currentStepId).toBe(3);
    expect(milestone(container, 2)).toHaveClass('active');

    await setProperty('currentStep', '{{1}}');
    await waitFor(() => expect(widget.exposed().currentStepId).toBe(1));
    expect(milestone(container, 0)).toHaveClass('active');
    expect(widget.variables().selectCount).toBe(1);
  });

  test('[Steps-STA-004] list action state survives semantic no-ops and yields to a changed active source', async () => {
    // Break this catches: any rerender discarding list actions, or a real source replacement retaining stale mutations.
    const { container } = widget.render();
    await widget.act('setStepVisible', 1, false);
    await widget.act('setStepDisable', 3, true);

    await setProperty('variant', 'numbers');
    await setProperty('steps', BASE_STEPS.map((row) => ({ ...row })));
    expect(widget.exposed().steps.find(({ id }) => id === 1).visible).toBe(false);
    expect(widget.exposed().steps.find(({ id }) => id === 3).disabled).toBe(true);

    await setProperty('steps', [step(1, 'Plan'), step(2, 'Build'), step(3, 'Ship changed')]);
    await waitFor(() => expect(widget.exposed().steps.find(({ id }) => id === 1).visible).toBe(true));
    expect(widget.exposed().steps.find(({ id }) => id === 3).disabled).toBe(false);
    expect(milestones(container)).toHaveLength(3);
  });

  test('[Steps-TIP-001] names and tooltips are inert text and disabled-aware', async () => {
    // Break this catches: passing object/HTML-like content into executable markup, or showing hints on disabled milestones.
    const hostile = '<img src=x onerror="window.__stepsXss=true">';
    const { container } = widget.render({
      properties: {
        steps: staticSteps([
          step(1, hostile, { tooltip: hostile }),
          step(2, 42, { tooltip: 42 }),
          step(3, { unsafe: true }, { tooltip: { unsafe: true } }),
          step(4, null, { tooltip: null }),
          step(5, 'Disabled hint', { tooltip: 'must stay hidden', disabled: true }),
        ]),
        currentStep: binding('{{1}}'),
      },
    });
    await waitFor(() => expect(milestones(container)).toHaveLength(5));
    expect(root(container).querySelector('img')).toBeNull();
    expect(labels(container)).toEqual([hostile, '42', '[object Object]', '', 'Disabled hint']);

    await widget.session.user.hover(milestone(container, 0));
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(hostile));
    expect(screen.getByRole('tooltip').querySelector('img')).toBeNull();
    await widget.session.user.unhover(milestone(container, 0));

    await widget.session.user.hover(milestone(container, 4));
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.queryByText('must stay hidden')).toBeNull();

    await widget.act('setDisabled', true);
    await widget.session.user.hover(milestone(container, 0));
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  test('[Steps-STY-001] registered colors, shadow, wrapper padding, and variant padding compose', async () => {
    // Break this catches: writing a color to the wrong CSS variable or letting a variant update erase wrapper/root styles.
    const shadow = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
    const { container } = widget.render({
      styles: {
        incompletedAccent: binding('#101010'),
        incompletedLabel: binding('#202020'),
        completedAccent: binding('#303030'),
        completedLabel: binding('#404040'),
        currentStepLabel: binding('#505050'),
        boxShadow: binding(shadow),
        padding: binding('none'),
      },
    });
    await waitFor(() => expect(root(container)).toBeInTheDocument());
    expect(root(container).style.getPropertyValue('--incompletedAccent')).toBe('#101010');
    expect(root(container).style.getPropertyValue('--incompletedLabel')).toBe('#202020');
    expect(root(container).style.getPropertyValue('--completedAccent')).toBe('#303030');
    expect(root(container).style.getPropertyValue('--completedLabel')).toBe('#404040');
    expect(root(container).style.getPropertyValue('--currentStepLabel')).toBe('#505050');
    expect(root(container)).toHaveStyle({ boxShadow: shadow });
    expect(canvasNode(container)).toHaveStyle({ padding: '0px' });

    await setProperty('variant', 'plain');
    await waitFor(() => expect(root(container)).toHaveStyle({ paddingTop: '3px' }));
    expect(root(container)).toHaveStyle({ boxShadow: shadow });
    expect(canvasNode(container)).toHaveStyle({ padding: '0px' });

    await setStyle('completedAccent', '#abcdef');
    await waitFor(() => expect(root(container).style.getPropertyValue('--completedAccent')).toBe('#abcdef'));
  });

  test('[Steps-OBS-001] label measurement observes only label mode and disconnects on replacement/removal', async () => {
    // Break this catches: observing non-label variants, retaining replaced observers, or updating from a removed instance.
    const InstalledObserver = window.ResizeObserver;
    const observers = [];
    window.ResizeObserver = class ResizeObserverControl {
      constructor(callback) {
        this.callback = callback;
        this.observe = jest.fn();
        this.disconnect = jest.fn();
        observers.push(this);
      }
    };
    try {
      const { container } = widget.render();
      await waitFor(() => expect(observers.length).toBeGreaterThanOrEqual(2));
      const activeObserver = observers.at(-1);
      expect(observers.slice(0, -1).every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
      expect(activeObserver.observe).toHaveBeenCalledWith(root(container));

      Object.defineProperty(root(container), 'offsetWidth', { configurable: true, value: 500 });
      const labelNodes = root(container).querySelectorAll('.label');
      Object.defineProperty(labelNodes[0], 'offsetWidth', { configurable: true, value: 80 });
      Object.defineProperty(labelNodes[labelNodes.length - 1], 'offsetWidth', { configurable: true, value: 100 });
      await widget.session.store.act(() => activeObserver.callback([{ target: root(container) }]));
      expect(root(container)).toHaveStyle({ paddingLeft: '49px', paddingRight: '49px' });
      expect(labelNodes[0]).toHaveStyle({ maxWidth: '146.66666666666666px' });

      await setProperty('variant', 'numbers');
      await waitFor(() => expect(activeObserver.disconnect).toHaveBeenCalledTimes(1));
      const countBeforeReturningToLabels = observers.length;

      await setProperty('variant', 'titles');
      await waitFor(() => expect(observers.length).toBeGreaterThan(countBeforeReturningToLabels));
      const replacement = observers.at(-1);
      await widget.session.store.act(() =>
        store().deleteComponents([ID], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true })
      );
      await waitFor(() => expect(canvasNode(container)).not.toBeInTheDocument());
      expect(replacement.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      window.ResizeObserver = InstalledObserver;
    }
  });

  test('[Steps-ISO-001] two instances isolate list state, actions, events, and removal', async () => {
    // Break this catches: unscoped exposed writes/event handlers or shared React state between widget instances.
    const { container } = widget.render({
      extraComponents: {
        [ID2]: stepsDefinition(ID2, HANDLE2, {
          steps: staticSteps([step(10, 'First'), step(20, 'Second')]),
          currentStep: binding('{{10}}'),
        }),
      },
      also: [{ id: ID2, componentType: 'Steps', widgetHeight: 80, widgetWidth: 500 }],
      events: [...selectEvents(ID, HANDLE, 'one'), ...selectEvents(ID2, HANDLE2, 'two')],
    });
    await waitFor(() => expect(widget.exposed(ID2).currentStepId).toBe(10));

    await widget.session.user.click(milestone(container, 2, HANDLE));
    await waitFor(() => expect(widget.variables().oneselectCount).toBe(1));
    expect(widget.exposed().currentStepId).toBe(3);
    expect(widget.exposed(ID2).currentStepId).toBe(10);
    expect(widget.variables().twoselectCount).toBeUndefined();

    await widget.session.store.act(async () => widget.exposed(ID2).setStepVisible(10, false));
    await waitFor(() => expect(labels(container, HANDLE2)).toEqual(['Second']));
    expect(labels(container, HANDLE)).toEqual(['Plan', 'Build', 'Ship']);

    await widget.act('setVisibility', false);
    expect(root(container, HANDLE)).toHaveStyle({ display: 'none' });
    expect(root(container, HANDLE2)).toHaveStyle({ display: 'flex' });

    await widget.session.store.act(() =>
      store().deleteComponents([ID], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true })
    );
    await waitFor(() => expect(canvasNode(container, HANDLE)).not.toBeInTheDocument());
    expect(canvasNode(container, HANDLE2)).toBeInTheDocument();
    expect(widget.exposed(ID2).steps.find(({ id }) => id === 10).visible).toBe(false);
  });

  test('[Steps-CFG-001] frontend/server registration and supported public handles stay aligned', () => {
    // Break this catches: one side renaming/removing a public handle or drifting a default while the other stays unchanged.
    const project = (config) => ({
      name: config.name,
      component: config.component,
      propertyKeys: Object.keys(config.properties),
      styleKeys: Object.keys(config.styles),
      eventKeys: Object.keys(config.events),
      exposedVariables: config.exposedVariables,
      actions: config.actions.map(({ handle, params }) => ({ handle, params: params.map(({ handle: key }) => key) })),
      defaults: {
        variant: config.definition.properties.variant.value,
        currentStep: config.definition.properties.currentStep.value,
        stepsSelectable: config.definition.properties.stepsSelectable.value,
        advanced: config.definition.properties.advanced.value,
        padding: config.definition.styles.padding.value,
      },
    });
    const expected = {
      name: 'Steps',
      component: 'Steps',
      propertyKeys: ['variant', 'schema', 'steps', 'stepsSelectable', 'disabledState', 'visibility', 'advanced', 'currentStep'],
      styleKeys: ['incompletedAccent', 'incompletedLabel', 'completedAccent', 'completedLabel', 'currentStepLabel', 'padding'],
      eventKeys: ['onSelect'],
      exposedVariables: { currentStepId: '3' },
      actions: [
        { handle: 'setStep', params: ['option'] },
        { handle: 'setVisibility', params: ['visible'] },
        { handle: 'setDisabled', params: ['disable'] },
        { handle: 'resetSteps', params: [] },
        { handle: 'setStepVisible', params: ['id', 'visibility'] },
        { handle: 'setStepDisable', params: ['id', 'disabled'] },
      ],
      defaults: {
        variant: 'titles',
        currentStep: '{{3}}',
        stepsSelectable: true,
        advanced: '{{false}}',
        padding: 'default',
      },
    };

    expect(project(frontendConfig)).toEqual(expected);
    expect(project(serverConfig)).toEqual(expected);
    expect(project(frontendConfig)).toEqual(project(serverConfig));
  });
});
