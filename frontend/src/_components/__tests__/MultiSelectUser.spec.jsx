import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { MultiSelectUser } from '../MultiSelectUser';

const alice = { name: 'Alice A (alice@x.com)', value: 'a', email: 'alice@x.com', first_name: 'Alice', last_name: 'A' };
const bob = { name: 'Bob B (bob@x.com)', value: 'b', email: 'bob@x.com', first_name: 'Bob', last_name: 'B' };

// Group admins tab: once a user is assigned, the parent refetches the addable list without them.
// The dropdown must show that fresh list the next time it opens, without the user typing.
it('drops a user from the dropdown when the options list shrinks', async () => {
  const props = { onSelect: jest.fn(), selectedValues: [], placeholder: 'Select users' };
  const { rerender } = render(<MultiSelectUser {...props} options={[alice, bob]} />);
  rerender(<MultiSelectUser {...props} options={[bob]} />);

  await userEvent.click(screen.getByPlaceholderText('Select users'));

  expect(await screen.findByText('Bob B')).toBeInTheDocument();
  expect(screen.queryByText('Alice A')).not.toBeInTheDocument();
});
