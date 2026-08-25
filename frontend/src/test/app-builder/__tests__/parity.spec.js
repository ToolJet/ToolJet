import React from 'react';
import { render, screen } from '@testing-library/react';
import Icon from '@assets/images/Logomark.svg';
import iconUrl from '@assets/images/no-apps.svg?url';

describe('App Builder Jest parity canary', () => {
  test('resolves JSX, aliases, assets, and edition fallbacks', () => {
    expect(require('@cloud/modules').name).toBe('Empty Module');
    expect(iconUrl).toBe('test-file-stub');
    render(<Icon title="parity icon" />);
    expect(screen.getByTitle('parity icon')).toBeInTheDocument();
  });
});
