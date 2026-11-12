import React, { useMemo } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderEnvironmentSelect from '../HeaderEnvironmentSelect';
import { useHeaderEnvironmentSelect } from '@/_hooks/useHeaderEnvironmentSelect';
import { useHeaderEnvironmentStore } from '@/_stores/headerEnvironmentStore';

const ENVIRONMENTS = [
  { id: 'env-dev', name: 'Development' },
  { id: 'env-prod', name: 'Production' },
];

function Page({ onChange, environmentId = 'env-prod' }) {
  const select = useMemo(() => ({ environments: ENVIRONMENTS, environmentId, onChange }), [environmentId, onChange]);
  useHeaderEnvironmentSelect(select);
  return null;
}

const setup = (props = {}) => {
  const onChange = jest.fn();
  const view = render(
    <>
      <HeaderEnvironmentSelect />
      <Page onChange={onChange} {...props} />
    </>
  );
  return { onChange, ...view };
};

beforeEach(() => act(() => useHeaderEnvironmentStore.getState().setSelect(null)));

describe('HeaderEnvironmentSelect', () => {
  it('renders nothing until a page provides an environment select', () => {
    render(<HeaderEnvironmentSelect />);
    expect(screen.queryByRole('button', { name: 'Environment' })).not.toBeInTheDocument();
  });

  it('shows the current environment as the button label', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Environment' })).toHaveTextContent('Production');
  });

  it('lists every environment as a checkbox and marks the current one', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Environment' }));
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Production' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Development' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
  });

  it('reports the chosen environment id', async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Environment' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Development' }));
    expect(onChange).toHaveBeenCalledWith('env-dev');
  });

  it('keeps the current environment when its checkbox is clicked again', async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Environment' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Production' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows no tooltip while the menu is open or right after it is dismissed', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Environment' }));
    await screen.findByRole('menuitemcheckbox', { name: 'Production' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Dismissing returns focus to the pill, which must not open its tooltip.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menuitemcheckbox', { name: 'Production' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Environment' })).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('still shows the tooltip when the pill is hovered', async () => {
    setup();
    await userEvent.hover(screen.getByRole('button', { name: 'Environment' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Choose which environment’s values the list shows.');
  });

  it('follows the page: a new environment updates the label, and unmounting removes the select', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <>
        <HeaderEnvironmentSelect />
        <Page onChange={onChange} environmentId="env-prod" />
      </>
    );
    rerender(
      <>
        <HeaderEnvironmentSelect />
        <Page onChange={onChange} environmentId="env-dev" />
      </>
    );
    expect(screen.getByRole('button', { name: 'Environment' })).toHaveTextContent('Development');

    rerender(<HeaderEnvironmentSelect />);
    expect(screen.queryByRole('button', { name: 'Environment' })).not.toBeInTheDocument();
  });
});
