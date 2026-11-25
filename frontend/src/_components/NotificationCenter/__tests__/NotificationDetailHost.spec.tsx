import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useNotificationsStore } from '@/_stores/notificationsStore';
import NotificationDetailHost from '../NotificationDetailHost';

const failed = {
  recipientId: 'r1',
  type: 'error',
  title: 'Version creation failed',
  body: "Couldn't create version v9.",
  createdAt: new Date().toISOString(),
  metadata: { error: 'Version name already exists.' },
};

describe('NotificationDetailHost', () => {
  afterEach(() => act(() => useNotificationsStore.setState({ detailNotification: null })));

  it('renders nothing while no notification is open', () => {
    render(<NotificationDetailHost />);
    expect(screen.queryByText('Version creation failed')).toBeNull();
  });

  it('shows the detail modal when a toast "View details" opens a notification', () => {
    render(<NotificationDetailHost />);
    act(() => useNotificationsStore.setState({ detailNotification: failed }));
    expect(screen.getByText('Version creation failed')).toBeTruthy();
  });

  it('closes through the store', () => {
    render(<NotificationDetailHost />);
    act(() => useNotificationsStore.setState({ detailNotification: failed }));
    act(() => useNotificationsStore.getState().actions.closeDetail());
    expect(screen.queryByText('Version creation failed')).toBeNull();
  });
});
