import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

// The host's validation: the pack's rule decides isValid and the message.
const hostValidation = (setExposedVariable) => {
  const latest = { current: { validate: () => ({ isValid: true }), validation: {}, setExposedVariable } };
  return (v, p, r) => useHostValidation(latest, v, p, r);
};

const mountRange = async (value, props = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const set = (key, v) => {
    exposed[key] = v;
  };
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-range-bounds"
      componentName="RangePicker"
      componentProps={{ value, ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={set}
      fireEvent={() => {}}
      actions={new Map()}
      host={{
        ...makeHost('RangePicker', { validation: 'date' }),
        useValidation: hostValidation(set),
      }}
      dataCy="ant-range"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-range"]').shadowRoot;
  await waitFor(() => expect(root().querySelectorAll('.ant-picker-input input')).toHaveLength(2));
  return { exposed, root };
};

// PKB-70: a range outside Min date / Max date is invalid, as the Ant DatePicker's value is.
describe('Ant RangePicker min and max', () => {
  const bounds = { minDate: '2025-02-10', maxDate: '2025-02-20' };

  it('is invalid when the start is before the min', async () => {
    const v = await mountRange(['2025-02-01', '2025-03-01'], bounds);
    await waitFor(() => expect(v.exposed.isValid).toBe(false));
  });

  it('is invalid when the end is after the max', async () => {
    const v = await mountRange(['2025-02-12', '2025-03-01'], bounds);
    await waitFor(() => expect(v.exposed.isValid).toBe(false));
  });

  it('is valid inside the bounds', async () => {
    const v = await mountRange(['2025-02-12', '2025-02-18'], bounds);
    await waitFor(() => expect(v.exposed.isValid).toBe(true));
  });

  it('compares a month picker by month', async () => {
    const v = await mountRange(['2025-02-01', '2025-02-28'], { ...bounds, picker: 'month' });
    await waitFor(() => expect(v.exposed.isValid).toBe(true));
  });
});
