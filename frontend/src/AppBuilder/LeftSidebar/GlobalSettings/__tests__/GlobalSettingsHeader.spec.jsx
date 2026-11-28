import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import GlobalSettingsHeader from '../GlobalSettingsHeader';

// Break this catches: the left Settings panel goes back to the "Global settings" heading.
test('titles the left settings panel App settings', () => {
  render(<GlobalSettingsHeader darkMode={false} onClose={() => {}} />);

  expect(screen.getByText('App settings')).toBeInTheDocument();
  expect(screen.queryByText('Global settings')).not.toBeInTheDocument();
});
