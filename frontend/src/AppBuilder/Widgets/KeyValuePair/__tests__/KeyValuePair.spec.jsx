import React from 'react';
import { render } from '@testing-library/react';
import { KeyValuePair } from '../KeyValuePair';

const renderKeyValuePair = (styles = {}) => {
  const { container } = render(
    <KeyValuePair
      id="kv-1"
      dataCy="draggable-widget-keyvaluepair1"
      componentType="KeyValuePair"
      currentLayout="desktop"
      currentMode="edit"
      width={43}
      height={200}
      darkMode={false}
      properties={{ dataSourceSelector: 'rawJson', data: {}, fields: [] }}
      styles={styles}
      fireEvent={jest.fn()}
      setExposedVariable={jest.fn()}
      setExposedVariables={jest.fn()}
    />
  );

  return container.querySelector('.key-value-pair-container');
};

describe('KeyValuePair container padding', () => {
  it('applies paddingInside to the container', () => {
    expect(renderKeyValuePair({ paddingInside: 24 })).toHaveStyle({ padding: '24px' });
  });

  it('parses a string paddingInside', () => {
    expect(renderKeyValuePair({ paddingInside: '16' })).toHaveStyle({ padding: '16px' });
  });

  it('falls back to no padding when paddingInside is absent', () => {
    // Components created before `paddingInside` existed carry no such style, and
    // the backfill migration pins them to 0 — they must not gain the new 12px
    // default retroactively.
    expect(renderKeyValuePair({})).toHaveStyle({ padding: '0px' });
  });
});
