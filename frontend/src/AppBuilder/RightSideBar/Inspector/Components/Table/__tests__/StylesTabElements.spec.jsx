import React from 'react';
import { render, screen } from '@testing-library/react';
import { StylesTabElements } from '../ColumnManager/StylesTabElements';

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <div data-testid="code-hinter" data-param-name={props.paramName} data-initial-value={String(props.initialValue)} />
));

const renderColumnStyles = (columnType, column) =>
  render(
    <StylesTabElements
      column={{ columnType, ...column }}
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

const renderRatingStyles = (column) => renderColumnStyles('rating', column);

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

describe.each([
  ['Table-COLTYPE-IMAGE-004', 'image'],
  ['Table-COLTYPE-LINK-002', 'link'],
  ['Table-COLTYPE-RATING-003', 'rating'],
])('[%s] StylesTabElements - %s column exposes a Cell color control', (scenarioId, columnType) => {
  test('renders a cellBackgroundColor binding defaulting to the surface token, like every other column type', () => {
    renderColumnStyles(columnType, {});
    const cellColorField = screen
      .getAllByTestId('code-hinter')
      .find((el) => el.dataset.paramName === 'cellBackgroundColor');
    expect(cellColorField).toBeDefined();
    expect(cellColorField.dataset.initialValue).toBe('var(--cc-surface1-surface)');
  });

  test('threads a configured cellBackgroundColor value through as the initial value', () => {
    renderColumnStyles(columnType, { cellBackgroundColor: 'rgb(255, 0, 0)' });
    const cellColorField = screen
      .getAllByTestId('code-hinter')
      .find((el) => el.dataset.paramName === 'cellBackgroundColor');
    expect(cellColorField).toBeDefined();
    expect(cellColorField.dataset.initialValue).toBe('rgb(255, 0, 0)');
  });
});
