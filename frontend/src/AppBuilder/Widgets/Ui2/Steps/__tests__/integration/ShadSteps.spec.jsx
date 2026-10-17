/**
 * UI 2.0 Steps: a numbered progress trail (a wizard's steps), with the steps done, the current one and those to come.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Steps widget itself does. Titles carry [ShadSteps-<AREA>-<NNN>] scenario ids.
 * The registered defaults apply: Account, Company, Billing and Done (ids 1 to 4), on step 2.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'steps1';
const widget = createWidgetHarness({
  componentType: 'ShadSteps',
  handle: 'steps1',
  id: ID,
  widgetHeight: 120,
  widgetWidth: 640,
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const step = (name) => screen.getByText(name).closest('button');
const current = () => document.querySelector('[aria-current=step]');
const click = async (name) => {
  await act(async () => fireEvent.click(step(name)));
};

describe('UI 2.0 Steps', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSteps-DEF-001] shows every step with its description, marks the current one, and exposes the steps', async () => {
    render();

    expect(await screen.findByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Plan and payment')).toBeInTheDocument();
    expect(current()).toHaveTextContent('Company');
    await waitFor(() => expect(exposed().currentStepId).toBe(2));
    expect(exposed().currentStepIndex).toBe(1);
    expect(exposed().steps).toHaveLength(4);
    expect(exposed().steps[0]).toEqual({
      id: 1,
      name: 'Account',
      description: 'Your details',
      visible: true,
      disabled: false,
    });
  });

  test('[ShadSteps-DEF-002] a step before the current one shows a check, a later one its number', async () => {
    render();

    await screen.findByText('Account');
    expect(step('Account').querySelector('svg')).toBeInTheDocument();
    expect(step('Account')).not.toHaveTextContent('1');
    expect(step('Billing')).toHaveTextContent('3');
    expect(step('Billing').querySelector('svg')).not.toBeInTheDocument();
  });

  test('[ShadSteps-PROP-001] steps take plain names (numbered from 1) and currentStep picks the current one', async () => {
    render({ properties: { steps: binding("{{['Draft', 'Review', 'Publish']}}"), currentStep: binding('{{3}}') } });

    await waitFor(() => expect(current()).toHaveTextContent('Publish'));
    expect(exposed()).toMatchObject({ currentStepId: 3, currentStepIndex: 2 });
    expect(exposed().steps.map((s) => s.id)).toEqual([1, 2, 3]);
  });

  test('[ShadSteps-PROP-002] a step marked disabled or not visible in steps is greyed out or left out', async () => {
    render({
      properties: {
        steps: binding(
          "{{[{ id: 'a', name: 'One' }, { id: 'b', name: 'Two', disabled: true }, { id: 'c', name: 'Three', visible: false }]}}"
        ),
        currentStep: binding('a'),
      },
    });

    await screen.findByText('One');
    expect(step('Two')).toBeDisabled();
    expect(screen.queryByText('Three')).not.toBeInTheDocument();
    expect(exposed().steps.map((s) => [s.id, s.visible, s.disabled])).toEqual([
      ['a', true, false],
      ['b', true, true],
      ['c', false, false],
    ]);
  });

  test('[ShadSteps-PROP-003] stepsSelectable off makes the steps a read-only trail', async () => {
    render({ properties: { stepsSelectable: binding('{{false}}') } });
    await handle(countInvocationsOn(ID, 'onSelect'));

    await screen.findByText('Billing');
    expect(step('Billing')).toBeDisabled();
    await click('Billing');

    expect(exposed().currentStepId).toBe(2);
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadSteps-PROP-004] orientation vertical stacks the steps; variant dots draws dots instead of numbers', async () => {
    render({ properties: { orientation: binding('vertical'), variant: binding('dots') } });

    await screen.findByText('Billing');
    const list = screen.getByRole('list', { name: 'Steps' });
    expect(list.className).toContain('tw-flex-col');
    expect(step('Billing')).not.toHaveTextContent('3');
    expect(step('Account').querySelector('svg')).not.toBeInTheDocument();
  });

  test('[ShadSteps-EVT-001] clicking a step makes it current and fires onSelect, whose handler reads the new step', async () => {
    render();
    await handle(setVariableOn(ID, 'onSelect', { value: '{{components.steps1.currentStepId}}' }));

    await screen.findByText('Billing');
    await click('Billing');

    await waitFor(() => expect(widget.variables().seen).toBe(3));
    expect(exposed().currentStepIndex).toBe(2);
    expect(current()).toHaveTextContent('Billing');
  });

  test('[ShadSteps-ACT-001] setStep moves to a step by id; nextStep and previousStep move one step', async () => {
    render();

    await widget.act('setStep', 4);
    await waitFor(() => expect(current()).toHaveTextContent('Done'));
    expect(exposed()).toMatchObject({ currentStepId: 4, currentStepIndex: 3 });

    await widget.act('nextStep');
    expect(exposed().currentStepId).toBe(4);

    await widget.act('previousStep');
    await waitFor(() => expect(exposed().currentStepId).toBe(3));
    await widget.act('nextStep');
    await waitFor(() => expect(exposed().currentStepId).toBe(4));
  });

  test('[ShadSteps-ACT-002] resetSteps goes back to the first step', async () => {
    render();
    await widget.act('nextStep');
    await waitFor(() => expect(exposed().currentStepId).toBe(3));

    await widget.act('resetSteps');

    await waitFor(() => expect(current()).toHaveTextContent('Account'));
    expect(exposed()).toMatchObject({ currentStepId: 1, currentStepIndex: 0 });
  });

  test('[ShadSteps-ACT-003] setStepVisible hides and shows a step, and the exposed steps follow', async () => {
    render();

    await widget.act('setStepVisible', 3, false);
    await waitFor(() => expect(screen.queryByText('Billing')).not.toBeInTheDocument());
    expect(exposed().steps.find((s) => s.id === 3).visible).toBe(false);

    await widget.act('setStepVisible', 3, true);
    expect(await screen.findByText('Billing')).toBeInTheDocument();
  });

  test('[ShadSteps-ACT-004] setStepDisable greys out a step so a click no longer picks it', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onSelect'));

    await widget.act('setStepDisable', 4, true);
    await waitFor(() => expect(step('Done')).toBeDisabled());
    expect(exposed().steps.find((s) => s.id === 4).disabled).toBe(true);
    await click('Done');
    expect(exposed().currentStepId).toBe(2);
    expect(widget.variables().calls).toBeUndefined();

    await widget.act('setStepDisable', 4, false);
    await waitFor(() => expect(step('Done')).not.toBeDisabled());
  });

  test('[ShadSteps-STY-001] step colours reach the trail as CSS variables, the completed accent as the theme accent', async () => {
    const { container } = render({
      styles: {
        completedAccent: binding('#16a34a'),
        incompletedAccent: binding('#cbd5e1'),
        completedLabel: binding('#14532d'),
        currentStepLabel: binding('#e11d48'),
        incompletedLabel: binding('#64748b'),
        descriptionColor: binding('#94a3b8'),
      },
    });

    await screen.findByText('Account');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.style.getPropertyValue('--lk-idle')).toBe('#cbd5e1');
    expect(root.style.getPropertyValue('--lk-done-label')).toBe('#14532d');
    expect(root.style.getPropertyValue('--lk-current-label')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-idle-label')).toBe('#64748b');
    expect(root.style.getPropertyValue('--lk-help')).toBe('#94a3b8');
    expect(screen.getByText('Company').className).toContain('var(--lk-current-label');
  });
});
