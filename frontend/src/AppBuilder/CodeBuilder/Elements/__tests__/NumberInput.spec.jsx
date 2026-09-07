import React from 'react';
import { render, screen } from '@testing-library/react';
import { NumberInput } from '../NumberInput';

// No mocks: SolidIcons resolves `name` through a real switch statement, so
// stubbing it would let a nonexistent icon name pass. Querying the forwarded
// `data-cy` exercises the whole chain — meta.prefixIcon -> SolidIcon ->
// solidIcons/index switch -> the icon component's own DOM.
const renderNumberInput = (meta = {}) =>
  render(<NumberInput value={6} onChange={jest.fn()} cyLabel="border-radius" meta={meta} />);

describe('NumberInput prefix icon', () => {
  it('renders the icon named by meta.prefixIcon and indents the input for it', () => {
    const { container } = renderNumberInput({ prefixIcon: 'corners', staticText: '' });

    expect(container.querySelector('[data-cy="border-radius-input-prefix-icon"]')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveStyle({ paddingLeft: '30px' });
  });

  it('renders no icon and no indent when meta declares no prefixIcon', () => {
    const { container } = renderNumberInput({ staticText: '' });

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton').style.paddingLeft).toBe('');
  });
});
