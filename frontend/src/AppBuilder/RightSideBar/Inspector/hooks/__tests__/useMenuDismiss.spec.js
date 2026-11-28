/**
 * RP-30: the component ⋮ menu in the configuration panel closes on Escape and on a click outside it.
 * Escape used to close it only as a side effect of the panel unmounting; the redesign keeps the panel.
 */
import { fireEvent, renderHook } from '@testing-library/react';
import { useMenuDismiss } from '../useMenuDismiss';

let menu;
beforeEach(() => {
  menu = document.createElement('div');
  menu.id = 'list-menu';
  menu.appendChild(document.createElement('button'));
  document.body.appendChild(menu);
});
afterEach(() => menu.remove());

// Break this catches: Escape leaves the menu open.
test('Escape closes the open menu', () => {
  const onDismiss = jest.fn();
  renderHook(() => useMenuDismiss(true, onDismiss, '#list-menu'));

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('a click outside closes it; a click inside does not', () => {
  const onDismiss = jest.fn();
  renderHook(() => useMenuDismiss(true, onDismiss, '#list-menu'));

  fireEvent.mouseDown(menu.firstChild);
  expect(onDismiss).not.toHaveBeenCalled();

  fireEvent.mouseDown(document.body);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('does nothing while the menu is closed', () => {
  const onDismiss = jest.fn();
  renderHook(() => useMenuDismiss(false, onDismiss, '#list-menu'));

  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.mouseDown(document.body);

  expect(onDismiss).not.toHaveBeenCalled();
});
