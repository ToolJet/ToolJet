import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Dialog } from '../../../../../../packs/shadcn/src/components/Dialog';

// A Rocket Dialog and what opens above it from another pack or from ToolJet (QA PKB-04, -05, -06): a ToolJet Dropdown's
// menu, a ToolJet Modal, another pack's dialog. Radix's modal Dialog set pointer-events: none on the page's body, so
// none of them took a click, pulled focus back from their fields into itself, and closed on an Escape pressed in a
// dialog above it, leaving that one open alone. The dialog now blocks only through its own backdrop, leaves focus where
// it is, and lets the dialog above it take the Escape. Only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeEach(() => loadLibraryModule.mockResolvedValue({ Dialog }));
afterEach(() => {
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

const ownLayer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const dialogContent = () => ownLayer()?.querySelector('[role="dialog"]');
const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const openDialog = async () => {
  const record = { exposed: {}, events: [], actions: new Map() };
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="cross-pack-dialogs"
      componentName="Dialog"
      componentProps={{ title: 'Outer', showBody: false }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        record.exposed[key] = value;
      }}
      fireEvent={(event) => record.events.push(event)}
      actions={record.actions}
      dataCy="Dialog"
    />
  );
  await waitFor(() => expect(record.actions.get('open')).toBeTruthy());
  act(() => record.actions.get('open')());
  await waitFor(() => expect(dialogContent()).toBeTruthy());
  await tick();
  return record;
};

// What opens above the dialog: another pack's popup layer, or a ToolJet Modal (drawn in the canvas).
const above = (className) => {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = '<input data-testid="above-field" />';
  document.body.appendChild(el);
  return el.querySelector('input');
};

const escapeFrom = (target) =>
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true })
    );
  });

describe('a Rocket Dialog with another dialog above it', () => {
  it('leaves the rest of the page its clicks', async () => {
    await openDialog();
    expect(document.body.style.pointerEvents).not.toBe('none');
  });

  it.each(['tj-cc-popup-host', 'modal'])(
    'lets a field in a %s above it keep focus, and stays open',
    async (className) => {
      const record = await openDialog();
      const field = above(className);
      act(() => field.focus());
      await tick();
      expect(document.activeElement).toBe(field);
      expect(dialogContent()).toBeTruthy();
      expect(record.events).not.toContain('onCancel');
    }
  );

  it.each(['tj-cc-popup-host', 'modal'])('leaves an Escape pressed in a %s above it to that one', async (className) => {
    const record = await openDialog();
    const field = above(className);
    act(() => field.focus());
    // The dialog above closes on an Escape nobody marked handled (react-bootstrap's Modal, behind a ToolJet Modal, checks
    // defaultPrevented).
    let seenAbove;
    document.addEventListener('keydown', (e) => (seenAbove = e.defaultPrevented), { once: true });
    escapeFrom(field);
    await tick();
    expect(seenAbove).toBe(false);
    expect(dialogContent()).toBeTruthy();
    expect(record.events).not.toContain('onCancel');
  });

  it('still closes on an Escape pressed in itself', async () => {
    const record = await openDialog();
    escapeFrom(dialogContent());
    await waitFor(() => expect(record.events).toContain('onCancel'));
  });
});
