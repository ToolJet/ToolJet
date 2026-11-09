import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SECRET_MASK } from '../../../helpers/constants';
import ConstantModal from '../ConstantModal';

const ENVS = [
  { id: 'dev', name: 'Development', enabled: true },
  { id: 'stg', name: 'Staging', enabled: true },
  { id: 'prod', name: 'Production', enabled: true },
];

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setup = (props = {}) => {
  const onOpenChange = jest.fn();
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(
    <ConstantModal mode="create" open onOpenChange={onOpenChange} environments={ENVS} onSubmit={onSubmit} {...props} />
  );
  return { onOpenChange, onSubmit, user: userEvent.setup() };
};

const globalConstant = () => ({
  id: 'c1',
  name: 'API_URL',
  type: 'Global',
  values: [
    { environment_id: 'dev', environment_name: 'Development', has_value: true, value: 'http://dev' },
    { environment_id: 'stg', environment_name: 'Staging', has_value: true, value: 'http://stg' },
    { environment_id: 'prod', environment_name: 'Production', has_value: false, value: null },
  ],
});

const secretConstant = () => ({
  id: 'c2',
  name: 'STRIPE_KEY',
  type: 'Secret',
  values: [
    { environment_id: 'dev', environment_name: 'Development', has_value: true, value: null },
    { environment_id: 'stg', environment_name: 'Staging', has_value: true, value: null },
  ],
});

const valueBox = (envName) => screen.getByRole('textbox', { name: `${envName} value` });

describe('ConstantModal — create', () => {
  it('shows the empty form with its copy', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Create constant' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('EXAMPLE_API_KEY')).toBeInTheDocument();
    expect(screen.getByText('Name must be unique and max 50 characters')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Global constants/ })).toBeChecked();
    expect(
      screen.getByText("Don't store credentials here as these are not masked.", { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText('Configure a value for each environment separately')).toBeInTheDocument();
    expect(screen.getByText('No values added yet')).toBeInTheDocument();
    expect(screen.getByText('Add an environment to create a value for this constant.')).toBeInTheDocument();
    expect(screen.getByText('Name and type cannot be edited post-creation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add constant' })).toBeDisabled();
  });

  it('adds a row from a quick-add chip and submits the body', async () => {
    const { user, onSubmit, onOpenChange } = setup();
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.type(valueBox('Development'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'MY_KEY',
      type: 'Global',
      values: [{ environment_id: 'dev', value: 'abc' }],
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('submits the Secret type when selected', async () => {
    const { user, onSubmit } = setup();
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('radio', { name: /Secrets/ }));
    await user.click(screen.getByRole('button', { name: /Staging/ }));
    await user.type(valueBox('Staging'), 'shh');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ type: 'Secret' });
  });

  it('shows a name error for an invalid name', async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), '1bad');
    expect(screen.getByText(/letters, numbers and underscores/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add constant' })).toBeDisabled();
  });

  it('hides added environments from the Add environment menu', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Staging/ }));
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Development/ })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /Production/ })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: /Staging/ })).not.toBeInTheDocument();
  });

  it('adds a row from the Add environment menu', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Production/ }));
    expect(valueBox('Production')).toBeInTheDocument();
  });

  it('says a value is required once a new empty box is left, and not before', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Production/ }));
    expect(screen.queryByText('Value is required')).not.toBeInTheDocument();

    await user.click(valueBox('Production'));
    await user.tab();

    expect(screen.getByText('Value is required')).toBeInTheDocument();
    await user.type(valueBox('Production'), 'v');
    expect(screen.queryByText('Value is required')).not.toBeInTheDocument();
  });

  it('shows a locked environment as disabled and names the plan in its tooltip', async () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }, ENVS[2]];
    const { user } = setup({ environments: envs, lockedPlanName: 'Business' });
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    const item = await screen.findByRole('menuitem', { name: /Staging/ });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    await user.hover(item.parentElement);
    expect((await screen.findAllByText('Available on Business plan')).length).toBeGreaterThan(0);
  });

  it('falls back to a generic tooltip when no plan name is given', async () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }];
    const { user } = setup({ environments: envs });
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    const item = await screen.findByRole('menuitem', { name: /Staging/ });
    await user.hover(item.parentElement);
    expect((await screen.findAllByText('Upgrade your plan to use this environment')).length).toBeGreaterThan(0);
  });

  it('offers quick-add chips only for environments the plan covers', () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }, ENVS[2]];
    setup({ environments: envs });
    expect(screen.getByRole('button', { name: /Development/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Production/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Staging/ })).not.toBeInTheDocument();
  });

  it('removes a row with its trash button', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.click(screen.getByRole('button', { name: 'Remove Development value' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('textbox', { name: 'Development value' })).not.toBeInTheDocument();
    expect(screen.getByText('No values added yet')).toBeInTheDocument();
  });

  it('allows only one row without multi-environment support', async () => {
    const { user } = setup({ multiEnvironment: false });
    await user.click(screen.getByRole('button', { name: /Development/ }));
    expect(screen.getByRole('button', { name: /Add environment/ })).toBeDisabled();
  });

  it('shows a pending state and blocks a second submit while saving', async () => {
    let resolve;
    const onSubmit = jest.fn(() => new Promise((r) => (resolve = r)));
    const { user } = setup({ onSubmit });
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.type(valueBox('Development'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    expect(screen.getByRole('button', { name: 'Add constant' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled());
  });

  it('maps a duplicate-name rejection to the name field and stays open', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ statusCode: 409, error: 'conflict' });
    const { user, onOpenChange } = setup({ onSubmit });
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.type(valueBox('Development'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    expect(await screen.findByText('A constant with this name and type already exists')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('clears the duplicate-name error once the name is edited', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ statusCode: 409, error: 'conflict' });
    const { user } = setup({ onSubmit });
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.type(valueBox('Development'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    await screen.findByText('A constant with this name and type already exists');
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), '2');
    expect(screen.queryByText('A constant with this name and type already exists')).not.toBeInTheDocument();
  });

  it('shows other server errors inline and stays open', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ statusCode: 500, error: 'Something broke' });
    const { user, onOpenChange } = setup({ onSubmit });
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    await user.type(valueBox('Development'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Add constant' }));
    expect(await screen.findByText('Something broke')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows the error under a value over 10000 characters and blocks submit', async () => {
    const { user } = setup();
    await user.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'MY_KEY');
    await user.click(screen.getByRole('button', { name: /Development/ }));
    fireEvent.change(valueBox('Development'), { target: { value: 'x'.repeat(10001) } });
    expect(screen.getByText(/10000 characters or fewer/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add constant' })).toBeDisabled();
  });

  it('starts from a fresh form every time it opens', async () => {
    const props = { mode: 'create', environments: ENVS, onOpenChange: jest.fn(), onSubmit: jest.fn() };
    const { rerender } = render(<ConstantModal {...props} open />);
    await userEvent.type(screen.getByPlaceholderText('EXAMPLE_API_KEY'), 'LEFTOVER');
    rerender(<ConstantModal {...props} open={false} />);
    rerender(<ConstantModal {...props} open />);
    expect(screen.getByPlaceholderText('EXAMPLE_API_KEY')).toHaveValue('');
  });

  it('closes on Cancel', async () => {
    const { user, onOpenChange } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ConstantModal — edit', () => {
  it('shows name and type read-only with Global values prefilled', () => {
    setup({ mode: 'edit', constant: globalConstant() });
    expect(screen.getByRole('dialog', { name: 'Edit constant' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('API_URL');
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Global constants/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Secrets/ })).toBeDisabled();
    expect(valueBox('Development')).toHaveValue('http://dev');
    expect(valueBox('Staging')).toHaveValue('http://stg');
    expect(screen.queryByRole('textbox', { name: 'Production value' })).not.toBeInTheDocument();
  });

  it('omits the name hint on the read-only name', () => {
    setup({ mode: 'edit', constant: globalConstant() });
    expect(screen.queryByText('Name must be unique and max 50 characters')).not.toBeInTheDocument();
  });

  it('says a value is required under a stored value that was cleared, and keeps Save disabled', async () => {
    const { user } = setup({ mode: 'edit', constant: globalConstant() });
    await user.clear(valueBox('Staging'));
    expect(screen.getByText('Value is required')).toBeInTheDocument();
    expect(valueBox('Staging')).toHaveAttribute('aria-invalid', 'true');
    expect(valueBox('Development')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('keeps Save changes disabled until something changes, then submits only the change', async () => {
    const { user, onSubmit } = setup({ mode: 'edit', constant: globalConstant() });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await user.type(valueBox('Staging'), '-2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({ values: [{ environment_id: 'stg', value: 'http://stg-2' }] });
  });

  it('swaps the Add button for All environments added once every environment has a value', async () => {
    const { user } = setup({ mode: 'edit', constant: globalConstant() });
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Production/ }));
    expect(screen.getByText('All environments added')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add environment/ })).not.toBeInTheDocument();
  });

  it('keeps Secret rows write-only: empty, masked placeholder, and untouched rows are not sent', async () => {
    const { user, onSubmit } = setup({ mode: 'edit', constant: secretConstant() });
    expect(valueBox('Development')).toHaveValue('');
    expect(valueBox('Development')).toHaveAttribute('placeholder', SECRET_MASK);
    await user.type(valueBox('Staging'), 'new-secret');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({ values: [{ environment_id: 'stg', value: 'new-secret' }] });
  });

  it('uses the lucide trash icon on the remove button, as in the design', () => {
    setup({ mode: 'edit', constant: globalConstant() });
    const icon = screen.getByRole('button', { name: 'Remove Staging value' }).querySelector('svg');
    expect(icon).toHaveClass('lucide-trash');
    expect(icon).not.toHaveClass('lucide-trash-2');
  });

  it('asks before removing a value, names the values that stay, and keeps the row on Cancel', async () => {
    const { user } = setup({ mode: 'edit', constant: globalConstant() });
    await user.click(screen.getByRole('button', { name: 'Remove Staging value' }));
    expect(await screen.findByText('Remove Staging value?')).toBeInTheDocument();
    expect(screen.getByText('The Development value stays.')).toBeInTheDocument();
    const popover = screen.getByText('Remove Staging value?').closest('[data-slot=popover-content]');
    await user.click(within(popover).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Remove Staging value?')).not.toBeInTheDocument();
    expect(valueBox('Staging')).toBeInTheDocument();
  });

  it('drops a confirmed removal from the form and sends null on save', async () => {
    const { user, onSubmit } = setup({ mode: 'edit', constant: globalConstant() });
    await user.click(screen.getByRole('button', { name: 'Remove Staging value' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('textbox', { name: 'Staging value' })).not.toBeInTheDocument();
    expect(screen.queryByText('Removed on save')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({ values: [{ environment_id: 'stg', value: null }] });
  });

  it('brings a removed environment back from the Add menu with its stored value', async () => {
    const { user } = setup({ mode: 'edit', constant: globalConstant() });
    await user.click(screen.getByRole('button', { name: 'Remove Staging value' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: /Add environment/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Staging/ }));
    expect(valueBox('Staging')).toHaveValue('http://stg');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('explains the last remaining value and does not let it be removed', async () => {
    const { user } = setup({ mode: 'edit', constant: globalConstant() });
    await user.click(screen.getByRole('button', { name: 'Remove Staging value' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: 'Remove Development value' }));
    expect(await screen.findByText('Remove Development value?')).toBeInTheDocument();
    expect(screen.getByText('This is the only value. The constant can’t be used without one.')).toBeInTheDocument();
    expect(screen.getByText('To delete the whole constant, use Delete from the constants list.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('keeps the name-and-type notice in the footer while editing', () => {
    setup({ mode: 'edit', constant: globalConstant() });
    expect(screen.getByText('Name and type cannot be edited post-creation')).toBeInTheDocument();
  });

  it('shows a value the plan no longer covers as not accessible and never sends it', async () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }, ENVS[2]];
    const { user, onSubmit } = setup({ mode: 'edit', constant: globalConstant(), environments: envs });
    expect(screen.getByText('Not accessible')).toBeInTheDocument();
    expect(valueBox('Staging')).toBeDisabled();
    expect(valueBox('Staging')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Remove Staging value' })).not.toBeInTheDocument();
    await user.type(valueBox('Development'), '!');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledWith({ values: [{ environment_id: 'dev', value: 'http://dev!' }] });
  });
});
