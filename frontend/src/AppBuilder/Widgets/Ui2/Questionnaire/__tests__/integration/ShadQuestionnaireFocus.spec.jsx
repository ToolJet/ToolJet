/**
 * UI 2.0 Questionnaire keyboard focus: stepping to another question from its buttons puts focus in that question
 * (release audit 20); an action that moves the step does not take focus. Titles carry [ShadQuestionnaire-<AREA>-<NNN>].
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({ componentType: 'ShadQuestionnaire', handle: 'questions1', id: 'questions1' });
const ITEMS =
  '{{[{ name: "first", prompt: "First question", type: "text" }, { name: "second", prompt: "Second question", type: "text", required: true }]}}';
const inQuestion = (name) => screen.getByRole('textbox', { name }).closest('fieldset').contains(document.activeElement);
const press = (button) =>
  act(async () => {
    button.focus();
    fireEvent.click(button);
  });

describe('UI 2.0 Questionnaire focus', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadQuestionnaire-FOCUS-001] Next puts focus in the next question, and Back in the one before', async () => {
    widget.render({ currentMode: 'view', properties: { items: binding(ITEMS) } });
    await press(await screen.findByRole('button', { name: 'Next' }));
    await screen.findByRole('textbox', { name: 'Second question' });
    await waitFor(() => expect(inQuestion('Second question')).toBe(true));
    await press(screen.getByRole('button', { name: /Back|Previous/ }));
    await screen.findByRole('textbox', { name: 'First question' });
    await waitFor(() => expect(inQuestion('First question')).toBe(true));
  });

  test('[ShadQuestionnaire-FOCUS-002] the goTo action moves the step without taking focus', async () => {
    widget.render({ currentMode: 'view', properties: { items: binding(ITEMS) } });
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await widget.act('goTo', 1);
    await screen.findByRole('textbox', { name: 'Second question' });
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
