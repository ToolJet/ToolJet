import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_BORDER_RADII, DEFAULT_SHADOWS } from '@tooljet/widget-definitions';
import { ThemeTokenField } from '../ThemeTokenField';

// A widget's Border radius / Box shadow style in the inspector (Figma "Applying theme to inputs"): a dropdown of the
// app theme's items plus Custom; Custom shows the existing control under it. Widgets saved before themes had these
// styles have no value: they read as Custom. The dropdown is the inspector's own Select (as Font Weight).

const radii = [...DEFAULT_BORDER_RADII, { id: 'custom-a1', name: 'Rounded', value: 8 }];
const setup = (props) => {
  const onSelect = jest.fn();
  const user = userEvent.setup();
  render(
    <ThemeTokenField kind="borderRadius" label="Border radius" items={radii} onSelect={onSelect} {...props}>
      <input aria-label="custom radius" />
    </ThemeTokenField>
  );
  return { onSelect, user };
};
const shown = (label) => within(screen.getByRole('group', { name: label }));
const open = (user, label) => user.click(screen.getByRole('combobox', { name: label }));

describe('ThemeTokenField', () => {
  it('reads Custom and shows the existing control when the widget has no theme style yet', () => {
    setup({ value: undefined });
    expect(shown('Border radius').getByText('Custom')).toBeInTheDocument();
    expect(screen.getByLabelText('custom radius')).toBeInTheDocument();
  });

  it('shows the chosen theme item and hides the custom control', () => {
    setup({ value: 'large' });
    expect(shown('Border radius').getByText('Large')).toBeInTheDocument();
    expect(screen.queryByLabelText('custom radius')).toBeNull();
  });

  it("lists the theme's radii with their values, then Custom", async () => {
    const { user } = setup({ value: 'large' });
    await open(user, 'Border radius');
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['None0px', 'Small2px', 'Medium4px', 'Large6px', 'Rounded8px', 'Custom']);
  });

  it('selects a theme item or Custom by id', async () => {
    const { user, onSelect } = setup({ value: 'custom' });
    await open(user, 'Border radius');
    await user.click(screen.getByRole('option', { name: /Rounded/ }));
    expect(onSelect).toHaveBeenLastCalledWith('custom-a1');
  });

  it('lists box shadows with their position, blur and spread', async () => {
    const user = userEvent.setup();
    render(
      <ThemeTokenField kind="shadows" label="Box shadow" items={DEFAULT_SHADOWS} value="none" onSelect={jest.fn()} />
    );
    await open(user, 'Box shadow');
    expect(screen.getByRole('option', { name: /^300/ })).toHaveTextContent('0 4px 8px 0');
  });

  // Found in the browser: after the app's theme changed, a widget set to the old theme's item showed that item's
  // internal id ("custom-x8k2p1q"). The widget draws its saved custom value then, so the field reads Custom with the
  // custom control, and never the id.
  it('reads Custom, with the custom control, for an item this theme does not have', () => {
    setup({ value: 'custom-gone' });
    expect(shown('Border radius').getByText('Custom')).toBeInTheDocument();
    expect(shown('Border radius').queryByText('custom-gone')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'custom radius' })).toBeInTheDocument();
  });

  // Reuse: the same dropdown as the other inspector selects (Font Weight): its active states, menu and dark mode.
  it("uses the inspector's own Select", () => {
    setup({ value: 'large' });
    expect(
      screen.getByRole('group', { name: 'Border radius' }).querySelector('[data-cy="dropdown-border-radius"]')
    ).not.toBeNull();
  });
});
