/**
 * UI 2.0 Questionnaire: one question at a time, with progress, answer cards with shortcuts, required-answer checks,
 * Previous / Skip / Next / Submit, and a completed screen.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Questionnaire itself does. Titles carry [ShadQuestionnaire-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'q1';
const ITEMS = `{{[
  { name: 'role', prompt: 'What best describes your role?', required: true, type: 'single', choices: [{ label: 'Operations', description: 'Day-to-day work' }, 'Finance'], other: true },
  { name: 'goals', prompt: 'Goals?', type: 'multiple', choices: ['Track orders', 'Approve requests'] },
  { name: 'notes', prompt: 'Anything else?', type: 'text', required: true }
]}}`;
const widget = createWidgetHarness({
  componentType: 'ShadQuestionnaire',
  handle: 'questions1',
  id: ID,
  widgetHeight: 480,
  widgetWidth: 600,
  defaultProperties: { items: binding(ITEMS), submitLabel: binding('Save plan') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const radio = (name) => screen.getByRole('radio', { name });

describe('UI 2.0 Questionnaire', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadQuestionnaire-DEF-001] shows the first question with its progress, lettered answers and empty answers', async () => {
    render();

    expect(await screen.findByText('Question 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'AOperationsDay-to-day work',
      'BFinance',
      'COther',
    ]);
    await waitFor(() =>
      expect(exposed()).toMatchObject({
        currentIndex: 0,
        currentItem: { name: 'role', type: 'single', required: true },
        isComplete: false,
        answers: { role: null, goals: [], notes: '' },
      })
    );
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  });

  test('[ShadQuestionnaire-VAL-001] a required question blocks Next until answered, then onStepChanged sees the move', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onStepChanged', { value: '{{components.questions1.currentItem.name}}' }));

    await screen.findByText('Question 1 of 3');
    click('Next');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to continue.');
    fireEvent.click(radio(/Finance/));
    expect(screen.queryByRole('alert')).toBeNull();
    click('Next');

    expect(await screen.findByText('Question 2 of 3')).toBeInTheDocument();
    await waitFor(() => expect(widget.variables().seen).toBe('goals'));
    expect(exposed()).toMatchObject({ currentIndex: 1, answers: { role: 'Finance' } });
  });

  test('[ShadQuestionnaire-KBD-001] shortcut letters pick an answer, and Other takes typed text', async () => {
    render();

    const group = await screen.findByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'b' });
    expect(radio(/Finance/)).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(group, { key: 'c' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Other' }), { target: { value: 'Legal' } });
    await waitFor(() => expect(exposed().answers.role).toBe('Legal'));
  });

  test('[ShadQuestionnaire-PROP-001] shortcuts numbers labels the answers 1, 2, 3; none drops the keys', async () => {
    render({ properties: { shortcuts: binding('numbers') } });
    await waitFor(() => expect(screen.getAllByRole('radio')[0].textContent).toBe('1OperationsDay-to-day work'));
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: '2' });
    expect(radio(/Finance/)).toHaveAttribute('aria-checked', 'true');

    render({ properties: { shortcuts: binding('none') } });
    await waitFor(() => expect(screen.getAllByRole('radio')[0].textContent).toBe('OperationsDay-to-day work'));
  });

  test('[ShadQuestionnaire-PROP-002] defaultAnswers prefill; Skip clears an optional answer; Previous goes back', async () => {
    render({ properties: { defaultAnswers: binding("{{({ role: 'Finance', goals: ['Track orders'] })}}") } });

    await waitFor(() => expect(radio(/Finance/)).toHaveAttribute('aria-checked', 'true'));
    click('Next');
    await screen.findByText('Question 2 of 3');
    click('Skip');
    expect(await screen.findByText('Question 3 of 3')).toBeInTheDocument();
    await waitFor(() => expect(exposed().answers.goals).toEqual([]));
    click('Previous');
    expect(await screen.findByText('Question 2 of 3')).toBeInTheDocument();
  });

  test('[ShadQuestionnaire-EVT-001] Submit checks every required answer, then completes and fires onSubmit with the answers', async () => {
    render({
      properties: {
        defaultAnswers: binding("{{({ role: 'Operations' })}}"),
        completeTitle: binding('All set'),
        completeText: binding('We saved your answers.'),
      },
    });
    widget.setEvents(setVariableOn(ID, 'onSubmit', { value: '{{components.questions1.answers.notes}}' }));

    await screen.findByText('Question 1 of 3');
    click('Next');
    click('Next');
    click('Save plan');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an answer to continue.');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Weekly report' } });
    click('Save plan');

    expect(await screen.findByText('All set')).toBeInTheDocument();
    expect(screen.getByText('We saved your answers.')).toBeInTheDocument();
    await waitFor(() => expect(widget.variables().seen).toBe('Weekly report'));
    expect(exposed()).toMatchObject({ isComplete: true, answers: { role: 'Operations', goals: [] } });
  });

  test('[ShadQuestionnaire-VAL-002] Submit jumps back to the first unanswered required question', async () => {
    render();

    await widget.act('goTo', 'notes');
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'x' } });
    click('Save plan');
    expect(await screen.findByText('Question 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to continue.');
  });

  test('[ShadQuestionnaire-ACT-001] goTo moves by index or name and fires onStepChanged; an unknown target is ignored', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onStepChanged', { value: '{{components.questions1.currentIndex}}' }));

    await widget.act('goTo', 2);
    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    await widget.act('goTo', 'nope');
    expect(exposed().currentIndex).toBe(2);
    await widget.act('goTo', 'goals');
    await waitFor(() => expect(exposed().currentIndex).toBe(1));
  });

  test('[ShadQuestionnaire-ACT-002] reset goes back to the first question with the default answers', async () => {
    render({ properties: { defaultAnswers: binding("{{({ role: 'Finance' })}}") } });

    await widget.act('goTo', 2);
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'Note' } });
    await widget.act('reset');

    await waitFor(() =>
      expect(exposed()).toMatchObject({ currentIndex: 0, isComplete: false, answers: { role: 'Finance', notes: '' } })
    );
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
  });

  test('[ShadQuestionnaire-PROP-003] submitLabel names the last button; a one-line text answer submits on Enter', async () => {
    render({
      properties: {
        items: binding(
          "{{[{ name: 'full_name', prompt: 'Your name?', type: 'text', multiline: false, required: true }]}}"
        ),
        submitLabel: binding('Send it'),
      },
    });

    expect(await screen.findByRole('button', { name: 'Send it' })).toBeInTheDocument();
    const box = screen.getByRole('textbox');
    expect(box.tagName).toBe('INPUT');
    fireEvent.change(box, { target: { value: 'Ada Lovelace' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() => expect(document.querySelector('[data-complete]')).not.toBeNull());
    // Without a completeTitle of its own it thanks the user.
    expect(screen.getByText('We will use them to set up your workspace.')).toBeInTheDocument();
  });

  test('[ShadQuestionnaire-PROP-004] showProgress off hides the counter; surface plain drops the card frame', async () => {
    const { container } = render({ properties: { showProgress: binding('{{false}}'), surface: binding('plain') } });

    await screen.findByRole('radiogroup');
    expect(screen.queryByText('Question 1 of 3')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(container.querySelector('.tj-shadcn .tw-p-6.tw-border')).toBeNull();

    const framed = render();
    await screen.findByText('Question 1 of 3');
    expect(framed.container.querySelector('.tj-shadcn .tw-p-6.tw-border')).toBeTruthy();
  });

  test('[ShadQuestionnaire-PROP-005] new items start over, and junk items draw as no questions', async () => {
    render();
    await screen.findByText('Question 1 of 3');
    fireEvent.click(radio(/Finance/));
    click('Next');
    await screen.findByText('Question 2 of 3');

    widget.setComponentProperty(
      ID,
      'items',
      "{{[{ name: 'only', prompt: 'Only one?', choices: ['Yes', 'No'] }]}}",
      'properties'
    );
    expect(await screen.findByText('Question 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeInTheDocument();

    widget.setComponentProperty(ID, 'items', 'not a list', 'properties');
    expect(await screen.findByText('No questions yet')).toBeInTheDocument();
  });

  // The pack's border reset beats an inline border colour, so the picked answer's accent edge goes through a class.
  test('[ShadQuestionnaire-STY-001] a picked answer is bordered in the accent; styles reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#9333ea'),
        backgroundColor: binding('#faf5ff'),
        borderColor: binding('#e9d5ff'),
        titleColor: binding('#3b0764'),
        textColor: binding('#6b21a8'),
        borderRadius: binding('{{16}}'),
        titleFontFamily: binding('serif'),
      },
    });

    const finance = await screen.findByRole('radio', { name: /Finance/ });
    expect(finance.style.borderColor).toBe('');
    expect(finance.className).toContain('tw-border-[color:var(--lk-border,var(--sc-border))]');
    fireEvent.click(finance);
    expect(finance.className).toContain('tw-border-[color:var(--lk-accent,var(--sc-primary))]');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-accent')).toBe('#9333ea');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#faf5ff');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e9d5ff');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#3b0764');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#6b21a8');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('16px');
    expect(root.style.getPropertyValue('--lk-title-font')).toMatch(/serif$/);
  });
});
