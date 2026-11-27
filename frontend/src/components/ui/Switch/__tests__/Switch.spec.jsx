import React from 'react';
import { render, screen } from '@testing-library/react';
import { Switch } from '../Switch';

describe('Switch', () => {
  test('its label names the switch', () => {
    render(<Switch label="Maintenance mode" />);
    expect(screen.getByRole('switch', { name: 'Maintenance mode' })).toBeInTheDocument();
  });

  test('two switches on one page keep their own names', () => {
    render(
      <>
        <Switch label="Maintenance mode" />
        <Switch label="Hide header" />
      </>
    );
    expect(screen.getByRole('switch', { name: 'Hide header' })).toBeInTheDocument();
  });

  test('a caller id still reaches the switch and its label', () => {
    render(<Switch id="maintenance" label="Maintenance mode" />);
    expect(screen.getByRole('switch', { name: 'Maintenance mode' })).toHaveAttribute('id', 'maintenance');
  });
});
