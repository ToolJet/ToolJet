import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
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

// The host's validation with Mandatory on: the Validation section is handed undefined when the field is empty.
const required = (setExposedVariable) => {
  const latest = {
    current: {
      validate: (v) =>
        v === undefined ? { isValid: false, validationError: 'Field cannot be empty' } : { isValid: true },
      validation: { mandatory: true },
      setExposedVariable,
    },
  };
  return (value, present, rule) => useHostValidation(latest, value, present, rule);
};

const mountRange = async (value, { mandatory = false } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const set = (key, v) => {
    exposed[key] = v;
  };
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-range-half"
      componentName="RangePicker"
      componentProps={{ value }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={set}
      fireEvent={() => {}}
      actions={new Map()}
      host={{
        ...makeHost('RangePicker', { validation: 'date' }),
        ...(mandatory ? { useValidation: required(set) } : {}),
      }}
      dataCy="ant-range"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-range"]').shadowRoot;
  await waitFor(() => expect(root().querySelectorAll('.ant-picker-input input')).toHaveLength(2));
  const inputs = () => [...root().querySelectorAll('.ant-picker-input input')].map((el) => el.value);
  return { exposed, inputs };
};

// A one-date value: the field, startDate and validation agree (AD-27), as ToolJet's Date range picker does.
describe('Ant RangePicker with only a start date', () => {
  it('shows the start date it exposes', async () => {
    const v = await mountRange(['2025-02-10']);
    await waitFor(() => expect(v.exposed.startDate).toBe('2025-02-10'));
    expect(v.exposed.endDate).toBe('');
    expect(v.inputs()).toEqual(['2025-02-10', '']);
  });

  it('is not valid when the field is required', async () => {
    const v = await mountRange(['2025-02-10'], { mandatory: true });
    await waitFor(() => expect(v.exposed.isValid).toBe(false));
  });

  it('a whole range shows both dates and is valid when required', async () => {
    const v = await mountRange(['2025-02-10', '2025-02-20'], { mandatory: true });
    await waitFor(() => expect(v.exposed.isValid).toBe(true));
    expect(v.inputs()).toEqual(['2025-02-10', '2025-02-20']);
  });
});
