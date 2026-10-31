import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionDeniedModal } from '../PermissionDeniedModal';

describe('PermissionDeniedModal', () => {
  it('tells the user they cannot create apps and to contact the admin', () => {
    render(<PermissionDeniedModal show onHide={jest.fn()} />);
    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(
      screen.getByText("You don't have access to create apps in this workspace. Contact admin.")
    ).toBeInTheDocument();
  });

  it('offers no way to create a workspace', () => {
    render(<PermissionDeniedModal show onHide={jest.fn()} />);
    expect(screen.queryByText(/new workspace/i)).not.toBeInTheDocument();
  });

  it('closes through the OK button', async () => {
    const onHide = jest.fn();
    render(<PermissionDeniedModal show onHide={onHide} />);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
