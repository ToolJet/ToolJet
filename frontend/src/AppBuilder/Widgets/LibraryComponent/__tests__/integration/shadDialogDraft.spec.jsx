import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Dialog } from '../../../../../../../packs/shadcn/src/components/Dialog';

// BN-01 (2026-10-25): closing a shadcn Dialog threw away the draft typed in a component dropped in its body, as its
// PopupSlot unmounted with Radix's content and released the canvas. The body now stays mounted while the dialog is
// closed (as Ant's forceRender and MUI's keepMounted), out of the page, and the closed dialog leaves no focus trap,
// aria-hidden or scroll lock behind. Only the module and CSS loading is replaced; the popup slot registry below
// follows usePackHost's (add once, release by name).
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
const button = (label) => [...layer().querySelectorAll('button')].find((b) => b.textContent === label);
const draftInput = () => document.querySelector('.tj-cc-popup-host [data-testid="draft"]');
// The <slot> the body's light-DOM wrapper is assigned to (null: not drawn).
const slotOf = (el) => el.closest('[slot]').assignedSlot;

// A dropped child: its draft lives in its own React state, lost if it remounts.
let mounts = 0;
const Draft = () => {
  const [value, setValue] = React.useState('');
  React.useEffect(() => {
    mounts += 1;
  }, []);
  return <input data-testid="draft" value={value} onChange={(e) => setValue(e.target.value)} />;
};

const Harness = ({ record, props }) => {
  const [popupSlotNames, setPopupSlotNames] = React.useState([]);
  const registerPopupSlot = React.useCallback((name) => {
    setPopupSlotNames((names) => (names.includes(name) ? names : [...names, name]));
    return () => setPopupSlotNames((names) => names.filter((n) => n !== name));
  }, []);
  const host = React.useMemo(
    () => ({
      disabled: false,
      loading: false,
      fieldId: 'dialog-draft',
      useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      setRows: () => {},
      rowSlotAttr: (index) => `tj-row-${index}`,
      registerPopupSlot,
      popupSlotAttr: (slot) => `tj-slot-dialog-${slot}`,
    }),
    [registerPopupSlot]
  );
  return (
    <>
      <button type="button" data-testid="page-button">
        Page
      </button>
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey="shad-dialog-draft"
        componentName="Dialog"
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          record.exposed[key] = value;
        }}
        fireEvent={(event) => record.events.push(event)}
        actions={record.actions}
        host={host}
        dataCy="Dialog"
        popupSlotNames={popupSlotNames}
        renderPopupSlot={() => <Draft />}
      />
    </>
  );
};

const PROPS = { title: 'Synthetic dialog', cancelText: 'Cancel', confirmText: 'Continue', showBody: true };

const setup = async (props = PROPS) => {
  mounts = 0;
  const record = { exposed: {}, events: [], actions: new Map() };
  render(<Harness record={record} props={props} />);
  await waitFor(() => expect(record.actions.get('open')).toBeTruthy());
  const open = async () => {
    act(() => record.actions.get('open')());
    await waitFor(() => expect(dialogContent()).toBeTruthy());
    if (props.showBody) await waitFor(() => expect(draftInput() && slotOf(draftInput())).toBeTruthy());
  };
  return { record, open };
};

// What a closed dialog may leave on the page: nothing modal.
const expectNothingModal = () => {
  expect(dialogContent()).toBeFalsy();
  expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  expect(document.querySelectorAll('[data-aria-hidden]')).toHaveLength(0);
  expect(document.querySelectorAll('[inert]')).toHaveLength(0);
  expect(document.body.style.overflow).not.toBe('hidden');
  expect(document.body.style.pointerEvents).not.toBe('none');
  expect(document.body.hasAttribute('data-scroll-locked')).toBe(false);
  expect(layer()?.querySelector('[data-radix-focus-guard]')).toBeFalsy();
  expect(document.querySelector('[data-radix-focus-guard]')).toBeFalsy();
};

describe('BN-01: a shadcn Dialog keeps the draft in its body across close and reopen', () => {
  it.each([
    ['Cancel', () => fireEvent.click(button('Cancel'))],
    ['the X', () => fireEvent.click(layer().querySelector('[aria-label="Close"]'))],
    ['Confirm', () => fireEvent.click(button('Continue'))],
    ['Escape', () => fireEvent.keyDown(dialogContent(), { key: 'Escape' })],
  ])('closed with %s', async (_, closeIt) => {
    const { record, open } = await setup();
    await open();
    const input = draftInput();
    fireEvent.change(input, { target: { value: 'Keep this draft' } });
    expect(draftInput().value).toBe('Keep this draft');

    closeIt();
    await waitFor(() => expect(record.exposed.show).toBe(false));
    await waitFor(() => expect(dialogContent()).toBeFalsy());
    // Still mounted, not drawn: the same node, assigned to no slot.
    expect(draftInput()).toBe(input);
    expect(slotOf(input)).toBeNull();
    expectNothingModal();

    await open();
    expect(draftInput()).toBe(input);
    expect(draftInput().value).toBe('Keep this draft');
    expect(mounts).toBe(1);
  });

  it('closed with the close action, and reopened again and again', async () => {
    const { record, open } = await setup();
    await open();
    const input = draftInput();
    fireEvent.change(input, { target: { value: 'Draft' } });
    for (let i = 0; i < 3; i += 1) {
      await act(async () => record.actions.get('close')());
      await waitFor(() => expect(dialogContent()).toBeFalsy());
      expect(slotOf(input)).toBeNull();
      expectNothingModal();
      await open();
      expect(draftInput()).toBe(input);
      expect(input.value).toBe('Draft');
    }
    expect(mounts).toBe(1);
  });

  it('the body is in the dialog while open, laid out at the body height', async () => {
    const { open } = await setup({ ...PROPS, bodyHeight: 180 });
    await open();
    const slot = slotOf(draftInput());
    expect(dialogContent().contains(slot)).toBe(true);
    expect(slot.closest('[data-tj-slot="body"]').style.height).toBe('180px');
  });

  it('a dialog without a body keeps no body', async () => {
    const { open } = await setup({ ...PROPS, showBody: false });
    await open();
    expect(draftInput()).toBeFalsy();
    expect(dialogContent().querySelector('[data-tj-slot]')).toBeFalsy();
  });
});
