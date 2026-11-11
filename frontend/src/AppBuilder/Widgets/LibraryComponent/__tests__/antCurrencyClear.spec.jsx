import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-03: clearing an Ant Design Currency Input (value 12, select the text, Backspace, click outside) left 0 in it,
// with value 0 and formattedValue US$0.00, so Required never caught it; Ant's own Input Number cleared to no value. The
// pack's Currency Input, the inline SDK and the host renderer are the real ones; only module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

let mounts = 0;
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-currency-clear"
      componentName="CurrencyInput"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={makeHost('CurrencyInput', {})}
      dataCy={`currency-${mounts}`}
    />
  );
  const input = () => view.container.querySelector(`[data-cy="currency-${mounts}"]`).shadowRoot.querySelector('input');
  await waitFor(() => expect(input()).toBeTruthy());
  await waitFor(() => expect(exposed.formattedValue).toBe('$12.00'));
  return { input, exposed, events };
};

describe('Ant Design Currency Input: clearing the field', () => {
  test('[PackComponent-CURRENCY-001] an emptied field has no value and no formatted value, and stays empty', async () => {
    const field = await mount({ value: 12, locale: 'en-US' });

    act(() => {
      fireEvent.focus(field.input());
      fireEvent.change(field.input(), { target: { value: '' } });
    });
    expect(field.exposed.value).toBeNull();

    act(() => {
      fireEvent.blur(field.input());
    });
    expect(field.exposed.value).toBeNull();
    expect(field.exposed.formattedValue).toBe('');
    expect(field.input().value).toBe('');
    expect(field.events).toContain('onChange');
  });

  test('[PackComponent-CURRENCY-002] a typed amount still reads as a number', async () => {
    const field = await mount({ value: 12, locale: 'en-US' });

    act(() => {
      fireEvent.focus(field.input());
      fireEvent.change(field.input(), { target: { value: '1,234.5' } });
      fireEvent.blur(field.input());
    });

    expect(field.exposed.value).toBe(1234.5);
    expect(field.exposed.formattedValue).toBe('$1,234.50');
  });
});
