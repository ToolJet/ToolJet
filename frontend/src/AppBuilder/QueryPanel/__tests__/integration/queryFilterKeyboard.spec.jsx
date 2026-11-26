import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useStore from '@/AppBuilder/_stores/store';
import FilterandSortPopup from '@/AppBuilder/QueryPanel/FilterandSortPopup';
import { seedApp } from '@/test/app-builder';
import { render } from '@/test/test-utils';

test('the query sort menu reaches and applies the final sort option by keyboard', async () => {
  seedApp({});
  render(<FilterandSortPopup darkMode={false} selectedDataSources={[]} />);
  const trigger = screen.getByRole('button', { name: 'Show sort/filter' });

  await userEvent.tab();
  expect(trigger).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(await screen.findByRole('button', { name: 'Custom order' })).toHaveFocus();

  for (let index = 0; index < 6; index++) await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Last modified: newest first' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  expect(useStore.getState().dataQuery).toMatchObject({ sortBy: 'updated_at', sortOrder: 'desc' });
  expect(trigger).toHaveFocus();
});
