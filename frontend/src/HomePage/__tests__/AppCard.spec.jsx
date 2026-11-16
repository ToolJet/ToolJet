import React from 'react';
import { render, screen } from '@/test/test-utils';
import AppCard from '../AppCard';

// The menu has its own spec; here we only check what the card tells it.
jest.mock('../AppMenu', () => ({
  AppMenu: ({ isReleased }) => <div data-testid="app-menu" data-released={String(isReleased)} />,
}));

global.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const renderCard = (app) =>
  render(
    <AppCard
      app={{ id: 'app-1', name: 'Support console', slug: 'support', ...app }}
      appType="front-end"
      canCreateApp={() => true}
      canDeleteApp={() => true}
      canUpdateApp={() => true}
      canViewApp={() => true}
      deleteApp={() => {}}
      exportApp={() => {}}
      appActionModal={() => {}}
    />
  );

describe('AppCard — usage analytics wiring', () => {
  it('tells the menu a released app is released', () => {
    renderCard({ current_version_id: 'version-1' });
    expect(screen.getByTestId('app-menu')).toHaveAttribute('data-released', 'true');
  });

  it('tells the menu an app that was never released is not released', () => {
    renderCard({ current_version_id: null });
    expect(screen.getByTestId('app-menu')).toHaveAttribute('data-released', 'false');
  });
});
