/**
 * UI 2.0 Questionnaire with more items or choices than it draws at once, and with its items replaced while a focus move
 * is pending (release audit round 2). Items past the 100th were dropped, so a required 101st question never blocked
 * the submit; choices past the 50th were dropped with no trace; and the focus a failed submit scheduled landed in the
 * replacement questions. Titles carry [ShadQuestionnaire-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'questions1';
const widget = createWidgetHarness({ componentType: 'ShadQuestionnaire', handle: 'questions1', id: ID });
const expr = (v) => `{{${JSON.stringify(v)}}}`;
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Questionnaire limits', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadQuestionnaire-LIMIT-001] a required question past the 100th still blocks completion', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ name: `q${i}`, prompt: `Question ${i}`, type: 'text' }));
    items.push({ name: 'last', prompt: 'Last question', type: 'text', required: true });
    widget.render({ currentMode: 'view', properties: { items: binding(expr(items)) } });
    await widget.act('goTo', 'last');
    expect(screen.getByText('Question 101 of 101')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));
    expect(exposed().isComplete).toBe(false);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an answer to continue.');
    expect(Object.keys(exposed().answers)).toHaveLength(101);
  });

  test('[ShadQuestionnaire-LIMIT-002] choices past the first 50 are a Show more away, and a default past them is shown', async () => {
    const choices = Array.from({ length: 120 }, (_, i) => `Choice ${i + 1}`);
    widget.render({
      currentMode: 'view',
      properties: {
        items: binding(expr([{ name: 'pick', prompt: 'Pick one', type: 'single', choices }])),
        defaultAnswers: binding(expr({ pick: 'Choice 70' })),
      },
    });
    const cards = () => document.querySelectorAll('[data-answer]');
    expect(cards()).toHaveLength(100);
    expect(screen.getByRole('radio', { name: /Choice 70/ })).toHaveAttribute('aria-checked', 'true');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Show 20 more of 20' })));
    expect(cards()).toHaveLength(120);
    expect(screen.queryByRole('button', { name: /^Show \d+ more/ })).toBeNull();
  });

  test('[ShadQuestionnaire-FOCUS-003] items replaced before a failed submit moves focus do not take focus', async () => {
    const items = [
      { name: 'first', prompt: 'First question', type: 'text', required: true },
      { name: 'second', prompt: 'Second question', type: 'text' },
    ];
    widget.render({ currentMode: 'view', properties: { items: binding(expr(items)) } });
    await widget.act('goTo', 1);
    const outside = document.createElement('button');
    document.body.append(outside);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      outside.focus();
      widget.setComponentProperty(
        ID,
        'items',
        expr([{ name: 'other', prompt: 'Another question', type: 'text' }]),
        'properties'
      );
    });
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(screen.getByRole('textbox', { name: 'Another question' })).toBeInTheDocument();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  test('[ShadQuestionnaire-FOCUS-004] a failed submit still puts focus in the question it moved to', async () => {
    const items = [
      { name: 'first', prompt: 'First question', type: 'text', required: true },
      { name: 'second', prompt: 'Second question', type: 'text' },
    ];
    widget.render({ currentMode: 'view', properties: { items: binding(expr(items)) } });
    await widget.act('goTo', 1);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'First question' }));
  });

  test('[ShadQuestionnaire-FOCUS-005] a failed submit on the same question focuses its field at once, with nothing pending', async () => {
    widget.render({
      currentMode: 'view',
      properties: { items: binding(expr([{ name: 'only', prompt: 'Only question', type: 'text', required: true }])) },
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Only question' }));
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
