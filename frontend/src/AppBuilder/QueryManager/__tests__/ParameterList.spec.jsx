import React from 'react';
import { render, screen } from '@testing-library/react';
import ParameterList from '../Components/ParameterList';

// SVG files are test doubles here; the third-party icon renderer needs real icon-node arrays.
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Icon: () => <svg />,
}));

describe('Query Manager named parameters', () => {
  test.each(['{"membership":true}', '{invalid JSON', { membership: true }, null])(
    'leaves plugin JSON parameters to the plugin editor without crashing: %p',
    (parameters) => {
      const { container } = render(
        <ParameterList parameters={parameters} containerRef={{ current: { offsetWidth: 1000 } }} />
      );
      expect(container).toBeEmptyDOMElement();
    }
  );

  test('still renders the named parameter controls for an empty input list', () => {
    render(<ParameterList parameters={[]} containerRef={{ current: { offsetWidth: 1000 } }} />);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });
});
