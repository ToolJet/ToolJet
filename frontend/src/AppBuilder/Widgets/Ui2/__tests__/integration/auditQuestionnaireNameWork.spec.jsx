import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture currentQuestionnaireRequiredNavigationWork016): normalizeItems gave a repeated
// question name the first free suffix by scanning from _2 each time, so n questions with one name took n(n+1)/2
// lookups (8,256 for 128). Each name now remembers where its next suffix search starts, so the work is linear and the
// names are the same. The controls: required answers skipped by goTo are rechecked on submit, which then sends one
// payload, and reset restores the defaults; unique names take one lookup each.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { normalizeItems } from '@/AppBuilder/Widgets/Ui2/Questionnaire/questionnaireModel';

const routes = ['text', 'single', 'multiple'].flatMap((type) => ['next', 'goTo'].map((route) => [type, route]));

describe.each(routes)('required %s answer, left via %s (control)', (type, route) => {
  const w = createWidgetHarness({
    componentType: 'ShadQuestionnaire',
    id: 'survey1',
    handle: 'survey1',
    widgetWidth: 600,
    widgetHeight: 400,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test('submit rechecks skipped required answers, then submits once and resets', async () => {
    const items = [
      {
        name: 'first',
        prompt: 'First answer',
        type,
        required: true,
        multiline: false,
        ...(type === 'text' ? {} : { choices: [{ label: 'Approved', value: 'yes' }] }),
      },
      { name: 'final', prompt: 'Final answer', type: 'text', required: true, multiline: false },
    ];
    w.render({
      currentMode: 'view',
      properties: {
        items: binding(items),
        defaultAnswers: binding({ final: 'Ready' }),
        submitLabel: binding('Save answers'),
      },
    });
    await waitFor(() => expect(w.exposed().currentItem.name).toBe('first'));
    w.setEvents(
      setVariableOn('survey1', 'onSubmit', {
        key: 'submissions',
        value: '{{[...(variables.submissions||[]),components.survey1.answers]}}',
      })
    );
    if (route === 'next') {
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true })));
      expect(w.exposed().currentItem.name).toBe('first');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }
    // goTo is navigation, not a claim the skipped question became valid.
    await w.act('goTo', 'final');
    expect(w.exposed().currentItem.name).toBe('final');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save answers' })));
    expect(w.exposed().isComplete).toBe(false);
    expect(w.variables().submissions).toBeUndefined();
    expect(w.exposed().currentItem.name).toBe('first');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await act(async () => {
      if (type === 'text')
        fireEvent.change(screen.getByRole('textbox', { name: 'First answer' }), { target: { value: 'Approved' } });
      else fireEvent.click(screen.getByRole(type === 'single' ? 'radio' : 'checkbox', { name: 'Approved' }));
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true })));
    expect(w.exposed().currentItem.name).toBe('final');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save answers' })));
    const answer = type === 'text' ? 'Approved' : type === 'single' ? 'yes' : ['yes'];
    expect(w.variables().submissions).toEqual([{ first: answer, final: 'Ready' }]);
    expect(w.exposed().isComplete).toBe(true);
    await w.act('reset');
    expect(w.exposed()).toMatchObject({
      currentIndex: 0,
      currentItem: { name: 'first' },
      isComplete: false,
      answers: { first: type === 'text' ? '' : type === 'single' ? null : [], final: 'Ready' },
    });
    expect(w.variables().submissions).toHaveLength(1);
  });
});

// Set lookups made while normalizing (the questions have no choices, so these are the name lookups).
const lookups = (input) => {
  const native = Set.prototype.has;
  let checks = 0;
  let normalized;
  const spy = jest.spyOn(Set.prototype, 'has').mockImplementation(function (value) {
    checks++;
    return native.call(this, value);
  });
  try {
    normalized = normalizeItems(input);
  } finally {
    spy.mockRestore();
  }
  return { checks, normalized };
};

test.each([32, 64, 128])('%s questions with one name take linear work and keep every question', (n) => {
  const run = (repeated) => {
    const input = Array.from({ length: n }, (_, i) => ({
      name: repeated ? 'answer' : `answer${i}`,
      prompt: `Question ${i}`,
      type: 'text',
    }));
    const { checks, normalized } = lookups(input);
    expect(normalized).toHaveLength(n);
    expect(new Set(normalized.map((q) => q.name)).size).toBe(n);
    expect(normalized.map((q) => q.prompt)).toEqual(input.map((q) => q.prompt));
    return { checks, names: normalized.map((q) => q.name) };
  };
  expect(run(false).checks).toBe(n);
  const repeated = run(true);
  expect(repeated.names).toEqual(['answer', ...Array.from({ length: n - 1 }, (_, i) => `answer_${i + 2}`)]);
  expect(repeated.checks).toBeLessThanOrEqual(2 * n);
});

test('a repeated name skips suffixes authored or given out earlier, as before', () => {
  const names = ['a', 'a_3', 'a', 'a', 'a_2', 'a', '', '', 'question1'].map((name) => ({ name, type: 'text' }));
  expect(normalizeItems(names).map((q) => q.name)).toEqual([
    'a',
    'a_3',
    'a_2',
    'a_4',
    'a_2_2',
    'a_5',
    'question7',
    'question8',
    'question1',
  ]);
});
