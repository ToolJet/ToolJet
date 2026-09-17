import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { KeyValuePair } from '../KeyValuePair';

/** Lets a real `requestAnimationFrame` callback run before continuing. */
const flushAnimationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const ONE_FIELD = [{ id: 'name', key: 'name', name: 'Name', fieldType: 'string', isEditable: false }];

const renderKeyValuePair = (styles = {}, properties = {}) => {
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
      properties={{ dataSourceSelector: 'rawJson', data: { name: 'Ada' }, fields: ONE_FIELD, ...properties }}
      styles={styles}
      fireEvent={jest.fn()}
      setExposedVariable={jest.fn()}
      setExposedVariables={jest.fn()}
    />
  );

  return container.querySelector('.key-value-pair-container');
};

describe('KeyValuePair container padding', () => {
  it('[KeyValuePair-STYLE-001] applies paddingInside to the container', () => {
    expect(renderKeyValuePair({ paddingInside: 24 })).toHaveStyle({ padding: '24px' });
  });

  it('[KeyValuePair-STYLE-001] parses a string paddingInside', () => {
    expect(renderKeyValuePair({ paddingInside: '16' })).toHaveStyle({ padding: '16px' });
  });

  it('[KeyValuePair-STYLE-001] falls back to no padding when paddingInside is absent', () => {
    // Components created before `paddingInside` existed carry no such style, and
    // the backfill migration pins them to 0 — they must not gain the new 12px
    // default retroactively.
    expect(renderKeyValuePair({})).toHaveStyle({ padding: '0px' });
  });
});

describe('KeyValuePair container/value style resolution', () => {
  it('[KeyValuePair-STYLE-002] resolves backgroundColor, borderColor, borderRadius, and boxShadow into the container style', () => {
    const container = renderKeyValuePair({
      backgroundColor: 'rgb(1, 2, 3)',
      borderColor: 'rgb(4, 5, 6)',
      borderRadius: 10,
      boxShadow: '1px 1px 1px 1px #000000',
    });

    expect(container).toHaveStyle({
      backgroundColor: 'rgb(1, 2, 3)',
      border: '1px solid rgb(4, 5, 6)',
      borderRadius: '10px',
      boxShadow: '1px 1px 1px 1px #000000',
    });
  });

  it('[KeyValuePair-STYLE-003] hoverBackgroundMode: manual sets the --kv-hover-bg custom property', () => {
    const container = renderKeyValuePair({ hoverBackgroundMode: 'manual', hoverBackgroundColor: 'rgb(9, 9, 9)' });

    expect(container.style.getPropertyValue('--kv-hover-bg')).toBe('rgb(9, 9, 9)');
  });

  it('[KeyValuePair-STYLE-003] hoverBackgroundMode: auto omits the --kv-hover-bg custom property', () => {
    const container = renderKeyValuePair({ hoverBackgroundMode: 'auto', hoverBackgroundColor: 'rgb(9, 9, 9)' });

    expect(container.style.getPropertyValue('--kv-hover-bg')).toBe('');
  });
});

describe('KeyValuePair label alignment/direction/width', () => {
  it('[KeyValuePair-LABEL-001] alignment: side (the real default) renders kv-row-side', () => {
    const container = renderKeyValuePair({});

    expect(container.querySelector('.key-value-row')).toHaveClass('kv-row-side');
  });

  it('[KeyValuePair-LABEL-001] alignment: top renders kv-row-top', () => {
    const container = renderKeyValuePair({ alignment: 'top' });

    expect(container.querySelector('.key-value-row')).toHaveClass('kv-row-top');
  });

  it('[KeyValuePair-LABEL-002] direction: right reverses row order only under alignment: side', () => {
    const sideContainer = renderKeyValuePair({ alignment: 'side', direction: 'right' });
    expect(sideContainer.querySelector('.key-value-row')).toHaveClass('kv-row-reverse');

    const topContainer = renderKeyValuePair({ alignment: 'top', direction: 'right' });
    expect(topContainer.querySelector('.key-value-row')).not.toHaveClass('kv-row-reverse');
  });

  it('[KeyValuePair-LABEL-003] autoLabelWidth: false applies the configured labelWidth percentage', () => {
    const container = renderKeyValuePair({ autoLabelWidth: false, labelWidth: 40 });

    const label = container.querySelector('.key-value-label');
    expect(label).toHaveStyle({ width: '40%' });
  });

  it('[KeyValuePair-LABEL-003] autoLabelWidth: true measures and applies a minWidth under alignment: side', async () => {
    const container = renderKeyValuePair({ autoLabelWidth: true, alignment: 'side' });

    await waitFor(() => expect(container.querySelector('.key-value-label').style.minWidth).not.toBe(''));
  });

  it('[KeyValuePair-LABEL-003] autoLabelWidth: true resets under alignment: top instead of measuring a width', async () => {
    const container = renderKeyValuePair({ autoLabelWidth: true, alignment: 'top' });

    await flushAnimationFrame();
    await flushAnimationFrame();
    expect(container.querySelector('.key-value-label').style.minWidth).toBe('');
  });
});
