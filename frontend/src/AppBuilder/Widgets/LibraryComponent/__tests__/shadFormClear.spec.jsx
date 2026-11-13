import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Select } from '../../../../../../packs/shadcn/src/components/Select';
import { DatePicker } from '../../../../../../packs/shadcn/src/components/DatePicker';
import { TimePicker } from '../../../../../../packs/shadcn/src/components/TimePicker';
import { RadioGroup } from '../../../../../../packs/shadcn/src/components/RadioGroup';
import { Checkbox } from '../../../../../../packs/shadcn/src/components/Checkbox';
import { MultiSelect } from '../../../../../../packs/shadcn/src/components/MultiSelect';
import { ownerAvailable } from '../../../../../../packs/shadcn/src/lib/useOwnerGuard';

// A Form's clearForm empties a shadcn pack field's exposed value (the SDK) and what the field shows (its own state): the
// value cleared while Select and DatePicker still showed the old choice (architecture audit, 2026-10-23). The pack
// components, the inline SDK, the host renderer and the Form signal are the real ones; only the module and CSS loading
// is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const OPTIONS = [
  { label: 'One', value: 1 },
  { label: 'Two', value: 2 },
];

const shown = (root) => root.textContent;
const checkedCount = (root) => root.querySelectorAll('[data-state="checked"]').length;

const CASES = [
  ['Select', Select, { options: OPTIONS, defaultValue: 1 }, (root) => shown(root).includes('One')],
  ['DatePicker', DatePicker, { defaultValue: '2026-10-23' }, (root) => shown(root).includes('23 Oct 2026')],
  ['TimePicker', TimePicker, { defaultValue: '09:30' }, (root) => /9:30|09:30/.test(shown(root))],
  ['RadioGroup', RadioGroup, { options: OPTIONS, defaultValue: 1 }, (root) => checkedCount(root) > 0],
  ['Checkbox', Checkbox, { label: 'Agree', defaultChecked: true }, (root) => checkedCount(root) > 0],
  ['MultiSelect', MultiSelect, { options: OPTIONS, defaultValue: [1] }, (root) => shown(root).includes('One')],
];

describe('a shadcn pack field in a Form', () => {
  test.each(CASES)(
    '%s: clearForm clears what it shows, not only its value',
    async (name, Component, props, showsChoice) => {
      loadLibraryModule.mockResolvedValue({ [name]: Component });
      const exposed = {};
      const host = {
        formField: true,
        fieldId: `clear-${name}`,
        disabled: false,
        loading: false,
        useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      };
      const make = (clearCount) => (
        <FormSignalContext.Provider value={{ clearCount, submitAttemptCount: 0 }}>
          <InlineLibraryComponent
            bundleUrl="pack.js"
            cssUrl="pack.css"
            cacheKey={`form-clear-${name}`}
            componentName={name}
            componentProps={props}
            componentStyles={{}}
            renderSlot={() => null}
            setExposedVariable={(key, value) => {
              exposed[key] = value;
            }}
            fireEvent={() => {}}
            actions={new Map()}
            host={host}
            dataCy="pack-field"
          />
        </FormSignalContext.Provider>
      );
      const view = render(make(0));
      const root = () => view.container.querySelector('[data-cy="pack-field"]').shadowRoot;
      await waitFor(() => expect(showsChoice(root())).toBe(true));
      view.rerender(make(1));
      await waitFor(() => expect(showsChoice(root())).toBe(false));
    }
  );
});

describe('a pack popup owner', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const ownerInShadow = () => {
    const wrapper = document.createElement('div');
    const host = document.createElement('div');
    wrapper.appendChild(host);
    document.body.appendChild(wrapper);
    const anchor = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(anchor);
    return { wrapper, anchor };
  };

  it('takes input while nothing around it is inert or disabled', () => {
    expect(ownerAvailable(ownerInShadow().anchor)).toBe(true);
  });

  it('does not once the widget around its shadow root is inert or aria-disabled (the host disabling or loading it)', () => {
    const { wrapper, anchor } = ownerInShadow();
    wrapper.setAttribute('inert', '');
    expect(ownerAvailable(anchor)).toBe(false);
    wrapper.removeAttribute('inert');
    wrapper.setAttribute('aria-disabled', 'true');
    expect(ownerAvailable(anchor)).toBe(false);
  });

  it('does not once it is removed', () => {
    const { anchor } = ownerInShadow();
    anchor.remove();
    expect(ownerAvailable(anchor)).toBe(false);
  });
});
