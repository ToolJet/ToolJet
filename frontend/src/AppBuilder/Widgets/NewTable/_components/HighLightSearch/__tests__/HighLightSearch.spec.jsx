import React from 'react';
import { render } from '@testing-library/react';
import { HighLightSearch } from '../HighLightSearch';

describe('HighLightSearch with regex special characters in the search term', () => {
  it('does not throw and highlights the literal match when the search term is an unbalanced "("', () => {
    const renderResult = () => render(<HighLightSearch text="Contact: (123) 456-7890" searchTerm="(" />);

    expect(renderResult).not.toThrow();

    const { container } = renderResult();
    expect(container.querySelector('mark')).toHaveTextContent('(');
  });

  it('treats other regex metacharacters in the search term as literal text, not regex syntax', () => {
    const { container } = render(<HighLightSearch text="a.b*c" searchTerm=".b*" />);

    expect(container.querySelector('mark')).toHaveTextContent('.b*');
  });
});
