import React from 'react';
import { screen } from '@testing-library/react';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { render } from '@/test/test-utils';

// Code search is a beta feature. The nav icon carries the same Beta tag the
// components panel uses on its Custom tab, so the rail matches that surface.
test('code search icon shows the components-panel Beta tag', () => {
  useStore.getState().setCurrentMode('edit', 'canvas');

  render(<BaseLeftSidebar />);

  const codeSearch = screen.getByRole('button', { name: 'Code search' });
  const beta = codeSearch.querySelector('.beta-tag-container');

  expect(beta).not.toBeNull();
  expect(beta).toHaveTextContent('Beta');
});
