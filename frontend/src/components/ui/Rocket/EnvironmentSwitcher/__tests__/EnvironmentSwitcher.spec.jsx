import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvironmentSwitcher } from '../EnvironmentSwitcher';

const OPTIONS = [
  { id: 'env-dev', label: 'Development', tone: 'info', meta: '0005' },
  { id: 'env-stg', label: 'Staging', tone: 'warning', meta: '0002' },
  { id: 'env-prod', label: 'Production', tone: 'warning', meta: '0001' },
];

const setup = (props = {}) => {
  const onValueChange = jest.fn();
  const view = render(
    <EnvironmentSwitcher options={OPTIONS} value="env-stg" onValueChange={onValueChange} {...props} />
  );
  return { onValueChange, ...view };
};

const trigger = () => screen.getByRole('button', { name: /environment$/i });
const openMenu = () => userEvent.click(trigger());

describe('EnvironmentSwitcher trigger', () => {
  it('shows the current option as "meta | label"', () => {
    setup();
    expect(trigger()).toHaveTextContent('0002');
    expect(trigger()).toHaveTextContent('Staging');
  });

  it('names the button after the current option', () => {
    setup();
    expect(trigger()).toHaveAccessibleName('Staging environment');
  });

  it('shows only the label when the option has no meta', () => {
    setup({ options: [{ id: 'env-stg', label: 'Staging', tone: 'warning' }] });
    expect(trigger()).toHaveTextContent(/^Staging$/);
  });

  it('is an empty, generically named button while the value is unknown', () => {
    setup({ value: undefined });
    expect(screen.getByRole('button', { name: 'Environment' })).toBeInTheDocument();
  });

  it('cannot be opened when disabled', async () => {
    setup({ disabled: true });
    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());
    expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument();
  });
});

describe('EnvironmentSwitcher menu', () => {
  it('lists every option and ticks only the current one', async () => {
    setup();
    await openMenu();
    const current = await screen.findByRole('menuitemcheckbox', { name: /Staging/ });
    expect(current).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: /Development/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitemcheckbox', { name: /Production/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps the meta out of the menu rows', async () => {
    setup();
    await openMenu();
    const rows = await screen.findAllByRole('menuitemcheckbox');
    expect(rows.map((row) => row.textContent)).toEqual(['Development', 'Staging', 'Production']);
  });

  it('reports the chosen option id', async () => {
    const { onValueChange } = setup();
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Development/ }));
    expect(onValueChange).toHaveBeenCalledWith('env-dev');
  });

  it('keeps the current option when it is clicked again', async () => {
    const { onValueChange } = setup();
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Staging/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe('with a disabled option', () => {
    const lockedSetup = () =>
      setup({
        options: [OPTIONS[0], { ...OPTIONS[1], disabled: true, disabledReason: 'Upgrade to use Staging.' }, OPTIONS[2]],
        value: 'env-dev',
      });

    it('does not select it', async () => {
      const { onValueChange } = lockedSetup();
      await openMenu();
      const locked = await screen.findByRole('menuitemcheckbox', { name: /Staging/ });
      expect(locked).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(locked);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('says why on hover', async () => {
      lockedSetup();
      await openMenu();
      await userEvent.hover(await screen.findByRole('menuitemcheckbox', { name: /Staging/ }));
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Upgrade to use Staging.');
    });
  });
});

describe('EnvironmentSwitcher tooltip', () => {
  const TOOLTIP = 'Choose which environment’s values to see.';

  it('shows the tooltip when the trigger is hovered', async () => {
    setup({ tooltip: TOOLTIP });
    await userEvent.hover(trigger());
    expect(await screen.findByRole('tooltip')).toHaveTextContent(TOOLTIP);
  });

  it('shows none unless one is given', async () => {
    setup();
    await userEvent.hover(trigger());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows none while the menu is open or right after it is dismissed', async () => {
    setup({ tooltip: TOOLTIP });
    await openMenu();
    await screen.findByRole('menuitemcheckbox', { name: /Staging/ });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Dismissing returns focus to the trigger, which must not open its tooltip.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menuitemcheckbox', { name: /Staging/ })).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
