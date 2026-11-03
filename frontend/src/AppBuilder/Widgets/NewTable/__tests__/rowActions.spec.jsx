/**
 * Row actions in the Table's ToolJet UI 2.0 look: a button column's buttonDisplay draws its buttons as icon buttons
 * ('icons') or one "..." menu ('menu'). A click runs the button's own events (the group's onClick with the button id
 * and the table's column events), exactly as a labelled button does; the ToolJet look keeps labelled buttons.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import useTableStore from '../_stores/tableStore';
import { ButtonColumnGroup } from '../_components/DataTypes/adapters/ButtonColumnGroupAdapter';
import { actionIcon, buttonDisplayOf, isDestructive } from '../_utils/rowActionIcon';

jest.mock('@/AppBuilder/_stores/store', () => {
  // Values pass through, except an fx string resolves against rowData the way the app store would for this test.
  const getResolvedValue = (value, context) => {
    if (typeof value === 'string' && value.startsWith('{{')) {
      const body = value.slice(2, -2);
      return new Function('rowData', `return (${body});`)(context?.rowData); // eslint-disable-line no-new-func
    }
    return value;
  };
  const state = { getResolvedValue };
  const useStore = (selector) => selector(state);
  useStore.getState = () => state;
  return { __esModule: true, default: useStore };
});
jest.mock('../_components/DataTypes/adapters/ButtonColumnAdapter', () => ({
  ButtonColumn: ({ buttonLabel, onClick }) => (
    <button type="button" data-labelled="" onClick={onClick}>
      {buttonLabel}
    </button>
  ),
}));
jest.mock('@/_ui/Icon/TablerIcon', () => ({
  __esModule: true,
  default: ({ iconName }) => <svg data-tabler={iconName} />,
}));

if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEvent;
}
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function scrollIntoView() {};
Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function release() {};

const BUTTONS = [
  { id: 'view', buttonLabel: 'View', buttonVisibility: true },
  { id: 'edit', buttonLabel: 'Edit', buttonIconName: 'IconPencilBolt', buttonIconVisibility: true },
  { id: 'mail', buttonLabel: 'Send reminder', disableButton: "{{rowData.status === 'Paid'}}" },
  { id: 'hidden', buttonLabel: 'Secret', buttonVisibility: false },
  { id: 'del', buttonLabel: 'Delete' },
];

const seed = (id, look) => {
  const store = useTableStore.getState();
  store.initializeComponent(id);
  store.setTableStyles(id, { tableLook: look }, false);
};

const renderGroup = (id, display, rowData = { status: 'Paid' }) => {
  const onClick = jest.fn();
  render(<ButtonColumnGroup id={id} buttons={BUTTONS} display={display} rowData={rowData} onClick={onClick} />);
  return onClick;
};

describe('rowActionIcon', () => {
  it('reads an icon from the label', () => {
    expect(
      ['Delete', 'Edit invoice', 'View', 'Approve', 'Reject', 'Export', 'Send reminder', 'Frobnicate'].map(actionIcon)
    ).toEqual(['trash', 'pencil', 'eye', 'check', 'x', 'download', 'send', '']);
    expect(actionIcon(null)).toBe('');
  });
  it('knows destructive labels and display modes', () => {
    expect(['Delete', 'Remove row', 'Reject', 'Edit', ''].map(isDestructive)).toEqual([true, true, true, false, false]);
    expect(['icons', 'menu', 'buttons', 'junk', undefined, {}].map(buttonDisplayOf)).toEqual([
      'icons',
      'menu',
      'buttons',
      'buttons',
      'buttons',
      'buttons',
    ]);
  });
});

describe('ButtonColumnGroup in the ToolJet UI 2.0 look', () => {
  it('draws icon buttons with the label as their name, skipping hidden ones, and runs the button on click', () => {
    seed('t-icons', 'shadcn');
    const onClick = renderGroup('t-icons', 'icons');
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['View', 'Edit', 'Send reminder', 'Delete']);
    // Its own Tabler icon when it shows one; an icon read from the label otherwise.
    expect(buttons[1].querySelector('[data-tabler="IconPencilBolt"]')).not.toBeNull();
    expect(buttons[0].querySelector('svg')).not.toBeNull();
    // A per-row disable binding holds; a destructive action is marked.
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].className).toContain('tj-row-action-destructive');
    fireEvent.click(buttons[3]);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBe('del');
  });

  // Review: <ActionIcon /> is always a truthy element, even when it renders null, so an action with no icon of its own
  // and a label the icon table does not know ("Reconcile", a localized label) drew a blank button.
  it('shows the label as text when an action has no icon of its own and none can be read from its label', () => {
    seed('t-text', 'shadcn');
    const onClick = jest.fn();
    const buttons = [
      { id: 'rec', buttonLabel: 'Reconcile' },
      { id: 'fr', buttonLabel: 'Supprimer' },
      { id: 'del', buttonLabel: 'Delete' },
    ];
    render(<ButtonColumnGroup id="t-text" buttons={buttons} display="icons" rowData={{}} onClick={onClick} />);
    const [reconcile, supprimer, del] = screen.getAllByRole('button');
    expect(reconcile).toHaveTextContent('Reconcile');
    expect(reconcile.querySelector('svg')).toBeNull();
    expect(reconcile.className).toContain('tj-row-action-icon--text');
    expect(supprimer).toHaveTextContent('Supprimer');
    // A label the table knows still draws its icon, without the text.
    expect(del.querySelector('svg')).not.toBeNull();
    expect(del).not.toHaveTextContent('Delete');
    expect(del.className).not.toContain('tj-row-action-icon--text');
  });

  it('collapses the buttons into a "..." menu whose items run the buttons', async () => {
    seed('t-menu', 'shadcn');
    const onClick = renderGroup('t-menu', 'menu', { status: 'Pending' });
    const trigger = screen.getByRole('button', { name: 'Row actions' });
    await act(async () => {
      fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    });
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['View', 'Edit', 'Send reminder', 'Delete']);
    // Delete sits apart after a separator and in the destructive colour.
    expect(document.querySelectorAll('.tj-row-action-separator')).toHaveLength(1);
    expect(items[3].className).toContain('tj-row-action-destructive');
    await act(async () => {
      fireEvent.click(items[1]);
    });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toBe('edit');
  });

  it('keeps labelled buttons in the ToolJet look, and for an unknown display', () => {
    seed('t-tooljet', 'default');
    renderGroup('t-tooljet', 'menu');
    expect(document.querySelectorAll('[data-labelled]')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Row actions' })).toBeNull();
  });

  it('keeps labelled buttons in the ToolJet UI 2.0 look when the display is buttons or junk', () => {
    seed('t-junk', 'shadcn');
    renderGroup('t-junk', 'sideways');
    expect(document.querySelectorAll('[data-labelled]')).toHaveLength(4);
  });
});
