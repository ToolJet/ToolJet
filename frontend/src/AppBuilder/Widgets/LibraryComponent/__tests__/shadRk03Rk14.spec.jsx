import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';

jest.mock('@/AppBuilder/_stores/store', () => {
  const { create: createStore } = jest.requireActual('zustand');
  return { __esModule: true, default: createStore(() => ({})) };
});
jest.mock('@/AppBuilder/Widgets/Listview/ListviewSubcontainer', () => ({ ListviewSubcontainer: () => null }));
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const { installBrowserStubs } = require('./fuzz/packTestEnv');
const InlineLibraryComponent = require('@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent').default;
const { usePackHost } = require('@/AppBuilder/Widgets/LibraryComponent/usePackHost');
const { loadLibraryModule } = require('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
const { Input } = require('../../../../../../packs/shadcn/src/components/Input');
const { PhoneInput } = require('../../../../../../packs/shadcn/src/components/PhoneInput');
const { OtpInput } = require('../../../../../../packs/shadcn/src/components/OtpInput');

installBrowserStubs();

// RK-03 / RK-14: the pack components, inline SDK and the real usePackHost (its event path judges the new value) are
// used; only the module and CSS loading is replaced.
const COMPONENTS = { Input, PhoneInput, OtpInput };

const Harness = ({ name, props, exposed }) => {
  const { host, exposeVariable, fireHostEvent } = usePackHost(
    {
      id: 'field1',
      width: 200,
      height: 40,
      currentLayout: 'desktop',
      darkMode: false,
      validate: () => ({ isValid: true }),
      validation: {},
      setExposedVariable: (key, value) => {
        exposed[key] = value;
      },
      fireEvent: () => {},
    },
    {}
  );
  return (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`rk03-${name}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={exposeVariable}
      fireEvent={fireHostEvent}
      actions={new Map()}
      host={host}
      dataCy="pack-field"
    />
  );
};

const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const view = render(<Harness name={name} props={props} exposed={exposed} />);
  const root = () => view.container.querySelector('[data-cy="pack-field"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('input')).toBeTruthy());
  return { exposed, root, rerender: (next) => view.rerender(<Harness name={name} props={next} exposed={exposed} />) };
};

const type = (root, text) => {
  const input = root().querySelector('input');
  // One character at a time, as typing does.
  for (let i = 1; i <= text.length; i++) fireEvent.change(input, { target: { value: text.slice(0, i) } });
  fireEvent.blur(input);
};

describe('RK-03: a typed value that fails the field own check', () => {
  it.each([
    ['Input', { inputType: 'email' }, 'bad', 'Enter a valid email address'],
    ['PhoneInput', {}, '123', 'Enter a valid phone number'],
    ['OtpInput', { length: 6 }, '12', 'Enter all 6 characters'],
  ])('[LibraryComponent-VALID-001] %s: isValid is false with the message shown', async (name, props, text, message) => {
    // Break this catches: the host's event-time judge republishing isValid true over the field's own rule.
    const { exposed, root } = await mount(name, props);
    type(root, text);
    await waitFor(() => expect(root().textContent).toContain(message));
    expect(exposed.isValid).toBe(false);
  });
});

describe('RK-14: OtpInput Length and Default value change together', () => {
  it('keeps the new default in the new number of boxes', async () => {
    // Break this catches: the Length reseed republishing the code the render before the new default.
    const { exposed, rerender, root } = await mount('OtpInput', { length: 6, defaultValue: '' });
    rerender({ length: 4, defaultValue: '12' });
    await waitFor(() => expect(exposed.value).toBe('12'));
    expect(root().querySelectorAll('[data-slot="otp"]')).toHaveLength(4);
    expect(root().querySelector('input').value).toBe('12');
  });
});
