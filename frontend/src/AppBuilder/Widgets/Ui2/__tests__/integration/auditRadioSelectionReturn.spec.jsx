/**
 * A RadioGroup choice whose option is removed stays cleared when the option comes back, as Select's does.
 *
 * Release audit round 3 (18 Oct), Codex fixture reviewRadioSelectionReturn: RadioGroup kept the removed option's key,
 * so the choice came back selected (in the Form's data too) with the option. An empty list is not a removal
 * (missingIsGone): a query's data is [] while it reruns, and the choice comes back with its option.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act } from '@testing-library/react';

const original = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
];

describe.each(['ShadRadioGroup', 'ShadSelect'])('%s selection refresh', (componentType) => {
  const w = createWidgetHarness({ componentType, id: 'choice1', handle: 'choice1', preload: ['Form'] });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  test('renaming and reordering keeps the choice with the fresh label', async () => {
    w.renderInsideForm({ properties: { options: binding(original) } });
    await w.act('selectOption', 'b');
    await act(async () =>
      w.setComponentProperty('choice1', 'options', [{ label: 'Beta updated', value: 'b' }, original[0]], 'properties')
    );
    expect(w.exposed().value).toBe('b');
    expect(w.exposed().selectedOption.label).toBe('Beta updated');
    expect(w.exposed('form1').formData.choice1).toBe('b');
  });

  test('a removed choice stays cleared when its option returns', async () => {
    w.renderInsideForm({ properties: { options: binding(original) } });
    await w.act('selectOption', 'b');
    await act(async () => w.setComponentProperty('choice1', 'options', [original[0]], 'properties'));
    expect(w.exposed().value).toBe('');
    expect(w.exposed('form1').formData.choice1).toBe('');
    await act(async () => w.setComponentProperty('choice1', 'options', original, 'properties'));
    expect({ value: w.exposed().value, form: w.exposed('form1').formData.choice1 }).toEqual({ value: '', form: '' });
  });

  test('an emptied list is not a removal: the choice returns with its option', async () => {
    w.renderInsideForm({ properties: { options: binding(original) } });
    await w.act('selectOption', 'b');
    await act(async () => w.setComponentProperty('choice1', 'options', [], 'properties'));
    await act(async () => w.setComponentProperty('choice1', 'options', original, 'properties'));
    expect({ value: w.exposed().value, form: w.exposed('form1').formData.choice1 }).toEqual({ value: 'b', form: 'b' });
  });
});
