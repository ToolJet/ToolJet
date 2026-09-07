import React from 'react';
import { render, screen } from '@testing-library/react';
import { StylesTabElements } from '../ColumnManager/StylesTabElements';

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <div data-testid="code-hinter" data-param-name={props.paramName} data-initial-value={String(props.initialValue)} />
));

const renderRatingStyles = (column) =>
  render(
    <StylesTabElements
      column={{ columnType: 'rating', ...column }}
      index={0}
      darkMode={false}
      currentState={{}}
      onColumnItemChange={jest.fn()}
      getPopoverFieldSource={jest.fn()}
      component={{ component: { name: 'table1' } }}
      selectedButtonId={null}
      buttonManager={{}}
    />
  );

describe('StylesTabElements - rating column selected color property binding', () => {
  test('binds Selected color to selectedBgColorStars when iconType is unset, matching the star default shown on a freshly added column', () => {
    renderRatingStyles({});
    const selectedColorField = screen
      .getAllByTestId('code-hinter')
      .find((el) => el.dataset.paramName === 'selectedBgColorStars');
    expect(selectedColorField).toBeDefined();
    expect(selectedColorField.dataset.initialValue).toBe('#EFB82D');
  });

  test('binds Selected color to selectedBgColorHearts when iconType is explicitly hearts', () => {
    renderRatingStyles({ iconType: 'hearts' });
    const selectedColorField = screen
      .getAllByTestId('code-hinter')
      .find((el) => el.dataset.paramName === 'selectedBgColorHearts');
    expect(selectedColorField).toBeDefined();
    expect(selectedColorField.dataset.initialValue).toBe('#EE5B67');
  });
});
