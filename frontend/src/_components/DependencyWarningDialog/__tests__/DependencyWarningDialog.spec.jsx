import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DependencyWarningDialog from '../DependencyWarningDialog';

it.each([false, true])('keeps the existing Modules warning layout and acknowledgement (dark=%s)', (darkMode) => {
  const onClose = jest.fn();
  const { rerender } = render(
    <DependencyWarningDialog
      open
      title="Dependent apps found!"
      message="Cannot delete this module as it is being used in one or more apps."
      darkMode={darkMode}
      onClose={onClose}
    />
  );
  const dialog = screen.getByRole('dialog', { name: 'Dependent apps found!' });
  expect(dialog).toHaveTextContent('Cannot delete this module as it is being used in one or more apps.');
  expect(dialog.querySelector('svg')).toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'I understand' });
  expect(button.parentElement).toHaveStyle({ borderTop: '1px solid var(--border-default)' });
  fireEvent.click(button);
  expect(onClose).toHaveBeenCalledTimes(1);
  rerender(<DependencyWarningDialog open={false} title="Dependent apps found!" onClose={onClose} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
