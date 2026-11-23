import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Dialog } from '../../../../../../packs/shadcn/src/components/Dialog';

// QA item 34: disabling a pack Dialog (Rocket Dialog, Ant Modal and Drawer, MUI Dialog) left the components in its body
// usable. The body is a popup slot, drawn in the pack's shared popup layer outside the widget, so the widget's inert
// never reached it. The body now takes no input while the widget is disabled or loading, as ModalV2's body, and is
// dimmed while disabled; what was typed in it is kept. Only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeEach(() => loadLibraryModule.mockResolvedValue({ Dialog }));
afterEach(() => {
  document.body.innerHTML = '';
});

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const dialogContent = () => layer()?.querySelector('[role="dialog"]');
const draftInput = () => document.querySelector('.tj-cc-popup-host [data-testid="draft"]');
// The light-DOM wrapper the body's components are drawn in, projected into the dialog's <slot>.
const bodyOf = (el) => el.closest('[slot]');

let mounts = 0;
const Draft = () => {
  const [value, setValue] = React.useState('');
  React.useEffect(() => {
    mounts += 1;
  }, []);
  return <input data-testid="draft" value={value} onChange={(e) => setValue(e.target.value)} />;
};

const Harness = ({ record, state }) => {
  const [popupSlotNames, setPopupSlotNames] = React.useState([]);
  const registerPopupSlot = React.useCallback((name) => {
    setPopupSlotNames((names) => (names.includes(name) ? names : [...names, name]));
    return () => setPopupSlotNames((names) => names.filter((n) => n !== name));
  }, []);
  const host = React.useMemo(
    () => ({
      disabled: state.disabled,
      loading: state.loading,
      fieldId: 'dialog-disabled',
      useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      setRows: () => {},
      rowSlotAttr: (index) => `tj-row-${index}`,
      registerPopupSlot,
      popupSlotAttr: (slot) => `tj-slot-dialog-${slot}`,
    }),
    [registerPopupSlot, state.disabled, state.loading]
  );
  return (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="pack-popup-disabled"
      componentName="Dialog"
      componentProps={{ title: 'Dialog', cancelText: 'Cancel', confirmText: 'Continue', showBody: true }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        record.exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={record.actions}
      host={host}
      dataCy="Dialog"
      popupSlotNames={popupSlotNames}
      renderPopupSlot={() => <Draft />}
    />
  );
};

const setup = async (state = { disabled: false, loading: false }) => {
  mounts = 0;
  const record = { exposed: {}, actions: new Map() };
  const view = render(<Harness record={record} state={state} />);
  await waitFor(() => expect(record.actions.get('open')).toBeTruthy());
  act(() => record.actions.get('open')());
  await waitFor(() => expect(dialogContent()).toBeTruthy());
  await waitFor(() => expect(draftInput()).toBeTruthy());
  const set = (next) => view.rerender(<Harness record={record} state={next} />);
  return { set };
};

describe('a disabled pack Dialog takes no input in its body (QA item 34)', () => {
  it('leaves the body usable while enabled', async () => {
    await setup();
    const body = bodyOf(draftInput());
    expect(body.hasAttribute('inert')).toBe(false);
    expect(body.getAttribute('aria-disabled')).toBeNull();
  });

  // Break this catches: the popup slot drawn without the widget's disabled state, so its inputs still take typing.
  it('makes the body inert and aria-disabled while disabled, and gives it back once enabled', async () => {
    const { set } = await setup();
    const input = draftInput();

    set({ disabled: true, loading: false });
    expect(bodyOf(input).hasAttribute('inert')).toBe(true);
    expect(bodyOf(input).getAttribute('aria-disabled')).toBe('true');
    expect(bodyOf(input).className).toContain('tw-opacity-50');

    set({ disabled: false, loading: false });
    expect(bodyOf(input).hasAttribute('inert')).toBe(false);
    expect(bodyOf(input).getAttribute('aria-disabled')).toBeNull();
    expect(bodyOf(input).className).not.toContain('tw-opacity-50');
    // The same body, not remounted: what was typed is kept.
    expect(draftInput()).toBe(input);
    expect(mounts).toBe(1);
  });

  it('takes no input while loading, as the widget does, without reading as disabled', async () => {
    const { set } = await setup();
    set({ disabled: false, loading: true });
    const body = bodyOf(draftInput());
    expect(body.hasAttribute('inert')).toBe(true);
    expect(body.getAttribute('aria-disabled')).toBeNull();
    expect(body.className).not.toContain('tw-opacity-50');
  });
});
