/**
 * The query name editor opens focused when a query is created (and from the rename trigger). Clicking
 * anywhere outside it ends editing like Enter does: a valid name is saved; an empty name, or one the
 * save rejects, is dropped and the old name stays.
 */
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryInlineNameEditor } from '@/AppBuilder/QueryManager/Components/QueryInlineNameEditor';
import { createAppBuilderControls } from '@/test/app-builder/controls';

const controls = createAppBuilderControls();

beforeEach(() => controls.observers.install());
afterEach(() => controls.restore());

const Harness = ({ onSave }) => {
  const [isEditing, setIsEditing] = useState(true);
  return (
    <>
      <QueryInlineNameEditor value="runjs2" isEditing={isEditing} onEditingChange={setIsEditing} onSave={onSave} />
      <div data-testid="canvas">canvas</div>
    </>
  );
};

const setup = (onSave = jest.fn()) => {
  const user = userEvent.setup();
  render(<Harness onSave={onSave} />);
  return { user, onSave, input: screen.getByRole('textbox', { name: 'Query name' }) };
};

const isEditing = () => screen.queryByRole('textbox', { name: 'Query name' }) !== null;

test('saves the typed name and stops editing on a click outside', async () => {
  const { user, onSave, input } = setup();

  await user.clear(input);
  await user.type(input, 'fetchOrders');
  await user.click(screen.getByTestId('canvas'));

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith('fetchOrders');
  await waitFor(() => expect(isEditing()).toBe(false));
});

test('stops editing without saving when the name was not changed', async () => {
  const { user, onSave } = setup();

  await user.click(screen.getByTestId('canvas'));

  expect(onSave).not.toHaveBeenCalled();
  await waitFor(() => expect(isEditing()).toBe(false));
});

test('drops an empty name on a click outside', async () => {
  const { user, onSave, input } = setup();

  await user.clear(input);
  await user.click(screen.getByTestId('canvas'));

  expect(onSave).not.toHaveBeenCalled();
  await waitFor(() => expect(isEditing()).toBe(false));
  expect(screen.getByText('runjs2')).toBeInTheDocument();
});

test('drops a name the save rejects on a click outside', async () => {
  const { user, input } = setup(jest.fn(() => 'Query name already exists'));

  await user.clear(input);
  await user.type(input, 'taken');
  await user.click(screen.getByTestId('canvas'));

  await waitFor(() => expect(isEditing()).toBe(false));
  expect(screen.getByText('runjs2')).toBeInTheDocument();
});

test('saves once when the save button is clicked', async () => {
  const { user, onSave, input } = setup();

  await user.clear(input);
  await user.type(input, 'fetchOrders');
  await user.click(screen.getByRole('button', { name: 'Save query name' }));

  expect(onSave).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(isEditing()).toBe(false));
});

test('cancels without saving when the cancel button is clicked', async () => {
  const { user, onSave, input } = setup();

  await user.type(input, 'X');
  await user.click(screen.getByRole('button', { name: 'Cancel query rename' }));

  expect(onSave).not.toHaveBeenCalled();
  await waitFor(() => expect(isEditing()).toBe(false));
});
