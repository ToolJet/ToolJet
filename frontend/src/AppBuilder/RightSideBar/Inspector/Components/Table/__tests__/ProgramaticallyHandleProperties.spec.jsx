import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <div data-testid="code-hinter" data-initial-value={String(props.initialValue)} />
));

const renderProperty = (property, props) =>
  render(
    <ProgramaticallyHandleProperties
      index={0}
      callbackFunction={jest.fn()}
      property={property}
      props={props}
      component={{ component: { name: 'table1' } }}
      paramMeta={{ type: 'colorSwatches', displayName: 'Selected color' }}
    />
  );

describe('ProgramaticallyHandleProperties - rating column selected color defaults', () => {
  test('shows the gold default for selectedBgColorStars when unset, matching the star icon render color', () => {
    renderProperty('selectedBgColorStars', {});
    expect(screen.getByTestId('code-hinter').dataset.initialValue).toBe('#EFB82D');
  });

  test('shows the red/pink default for selectedBgColorHearts when unset, matching the heart icon render color', () => {
    renderProperty('selectedBgColorHearts', {});
    expect(screen.getByTestId('code-hinter').dataset.initialValue).toBe('#EE5B67');
  });

  test('keeps an explicitly set selectedBgColorStars value instead of the default', () => {
    renderProperty('selectedBgColorStars', { selectedBgColorStars: '#123456' });
    expect(screen.getByTestId('code-hinter').dataset.initialValue).toBe('#123456');
  });

  test('keeps an explicitly set selectedBgColorHearts value instead of the default', () => {
    renderProperty('selectedBgColorHearts', { selectedBgColorHearts: '#654321' });
    expect(screen.getByTestId('code-hinter').dataset.initialValue).toBe('#654321');
  });
});
