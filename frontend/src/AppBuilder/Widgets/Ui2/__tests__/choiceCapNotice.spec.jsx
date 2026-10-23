import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A Radio group and a Toggle group draw at most 100 choices (MAX_CHOICES: a 10,000-option binding froze the page), but
 * given 1,000 they drew the first 100 with no word of the rest. They now say so under the choices, with the Select's
 * wording and its pointer to a Combobox, and their Options field says the limit.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/widgetHarness';
import { screen } from '@testing-library/react';
import { CONFIGS } from './packWidgets';
import { MAX_CHOICES } from '@/AppBuilder/Widgets/Ui2/_shared/choices';

const many = (n) => Array.from({ length: n }, (_, i) => ({ label: `Choice ${i + 1}`, value: `c${i + 1}` }));

describe.each(['ShadRadioGroup', 'ShadToggleGroup'])('%s past its choice limit', (type) => {
  const w = createWidgetHarness({
    componentType: type,
    id: 'group1',
    handle: 'group1',
    widgetHeight: 350,
    widgetWidth: 500,
  });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  const render = (options) =>
    w.render({
      currentMode: 'view',
      properties: { options: binding('{{' + JSON.stringify(options) + '}}'), defaultValue: binding("{{'c5'}}") },
    });
  // A single-choice toggle group's items are radios too (Radix).
  const item = (label) => screen.queryByRole('radio', { name: label });

  test('says how many of the options it shows, and what reaches them all', () => {
    render(many(1000));
    expect(item('Choice 100')).not.toBeNull();
    expect(item('Choice 101')).toBeNull();
    expect(screen.getByText('Showing 100 of 1000 options. A Combobox searches them all.')).toBeInTheDocument();
    // Every option is still exposed.
    if (type === 'ShadRadioGroup') expect(w.exposed().options).toHaveLength(1000);
  });

  test('says nothing within the limit', () => {
    render(many(MAX_CHOICES));
    expect(item('Choice 100')).not.toBeNull();
    expect(screen.queryByText(/^Showing \d+ of \d+ options/)).toBeNull();
  });

  test('its Options field says the limit', () => {
    expect(CONFIGS[type].properties.options.note).toMatch(/Draws the first 100 options/);
  });
});
