import React from 'react';
import { render } from '@testing-library/react';
import { getSvgIcon } from '../appUtils';

describe('Anthropic Logo Dark Mode Support (#18152)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the dark Anthropic icon when dark mode is enabled', () => {
    localStorage.setItem('darkMode', 'true');
    const mockIconData = 'PHN2Zz48L3N2Zz4=';
    const { container } = render(getSvgIcon('anthropic', 32, 32, mockIconData));
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('data-file-name', 'anthropic-dark.svg');
    expect(container.querySelector('img')).toBeNull();
  });

  it('preserves the original light mode icon when dark mode is disabled', () => {
    localStorage.setItem('darkMode', 'false');
    const mockIconData = 'PHN2Zz48L3N2Zz4=';
    const { container } = render(getSvgIcon('anthropic', 32, 32, mockIconData));
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `data:image/svg+xml;base64,${mockIconData}`);
    expect(container.querySelector('svg')).toBeNull();
  });
});
