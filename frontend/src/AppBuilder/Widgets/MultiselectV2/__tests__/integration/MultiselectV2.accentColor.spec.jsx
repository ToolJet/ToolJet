/**
 * MultiselectV2 — the accent color on a selected option's checkbox.
 *
 * Added with the accent color fix; not tied to a contract scenario yet.
 */
import { screen, within } from '@testing-library/react';
import { binding, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();

async function openMenu() {
  await harness.session.user.click(screen.getByRole('combobox'));
  await drain();
}

const checkboxOf = (label) => {
  const row = screen.getAllByRole('option').find((candidate) => candidate.textContent.includes(label));
  if (!row) throw new Error(`no option row rendering "${label}"`);
  return within(row).getByRole('checkbox');
};

describe('MultiselectV2 accent color', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('a selected option renders its checkbox with the configured accent color', async () => {
    harness.render({
      properties: { values: binding("{{['1']}}") },
      styles: { accentColor: binding('#008000') },
    });
    await drain();
    await openMenu();

    const checkbox = checkboxOf('option1');
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveStyle({ backgroundColor: '#008000', borderColor: '#008000' });
  });

  test('an unselected option does not get the accent color applied', async () => {
    harness.render({
      properties: { values: binding("{{['1']}}") },
      styles: { accentColor: binding('#008000') },
    });
    await drain();
    await openMenu();

    const checkbox = checkboxOf('option2');
    expect(checkbox).not.toBeChecked();
    expect(checkbox.style.backgroundColor).toBe('');
  });
});
