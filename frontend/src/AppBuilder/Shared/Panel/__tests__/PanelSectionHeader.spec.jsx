import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PanelSectionHeader from '../PanelSectionHeader';

// Break this catches: a section header that hides its state from assistive tech or puts the count in
// its title, as Dependencies' "Queries (15)" did.
test('names the section, shows the count apart from the title and toggles with its expanded state', async () => {
  const onToggle = jest.fn();
  render(<PanelSectionHeader title="Queries" count={15} open onToggle={onToggle} dataCy="section-queries" />);
  const header = screen.getByRole('button', { name: /Queries/ });

  expect(header).toHaveAttribute('aria-expanded', 'true');
  expect(header.querySelector('.tj-panel-section-header__title')).toHaveTextContent(/^Queries$/);
  expect(header.querySelector('.tj-panel-section-header__count')).toHaveTextContent('15');
  // The caret trails the title, like the panels' accordion headers.
  expect(header.lastElementChild).toHaveClass('tj-panel-section-header__caret');

  await userEvent.click(header);
  expect(onToggle).toHaveBeenCalledTimes(1);
});
