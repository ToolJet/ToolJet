import React from 'react';
import { render } from '@testing-library/react';
import { HighLightSearch } from '../HighLightSearch';

describe('Table search highlighting', () => {
  test.each([
    '(',
    ')',
    '[',
    ']',
    '*',
    '+',
    '?',
    '.',
    '^',
    '$',
    '{',
    '}',
    '|',
    '\\',
    'C++',
    '[draft]',
    '(draft)',
    'a.b',
  ])('highlights %s as literal text without changing the cell content', (searchTerm) => {
    const text = `Before ${searchTerm} after ${searchTerm}`;
    const { container } = render(<HighLightSearch text={text} searchTerm={searchTerm} />);

    expect(container.textContent).toBe(text);
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      searchTerm,
      searchTerm,
    ]);
  });

  test('preserves case when highlighting repeated matches', () => {
    const { container } = render(<HighLightSearch text="Draft and DRAFT" searchTerm="draft" />);

    expect(container.textContent).toBe('Draft and DRAFT');
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual(['Draft', 'DRAFT']);
  });

  test.each(['', 'missing'])('leaves text unchanged for search %s', (searchTerm) => {
    const { container } = render(<HighLightSearch text="Draft" searchTerm={searchTerm} />);

    expect(container.textContent).toBe('Draft');
    expect(container.querySelector('mark')).toBeNull();
  });

  test('renders an empty cell without a highlight', () => {
    const { container } = render(<HighLightSearch text="" searchTerm="(" />);

    expect(container).toBeEmptyDOMElement();
  });

  test('highlights numeric cell values', () => {
    const { container } = render(<HighLightSearch text={12.5} searchTerm="." />);

    expect(container.textContent).toBe('12.5');
    expect(container.querySelector('mark')).toHaveTextContent('.');
  });
});
