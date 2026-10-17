import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { focusables, openerOf, trapTab, watchOpeners } from '@/AppBuilder/Widgets/Ui2/Dialog/dialogFocus';

// The Dialog (ModalV2 in the pack's look) has react-bootstrap's focus enforcement off, so Tab left an open dialog for
// the page behind it (found in a headless browser: 7 of 12 Tab presses landed outside). trapTab wraps it at the ends.
describe('dialog focus', () => {
  let root;
  let outside;
  beforeEach(() => {
    document.body.innerHTML = '';
    outside = document.createElement('button');
    outside.textContent = 'behind';
    root = document.createElement('div');
    root.innerHTML =
      '<input id="a"/><button id="b">B</button><div style="display:none"><button id="hidden">H</button></div><button id="c" disabled>C</button><button id="d">D</button>';
    document.body.append(outside, root);
  });
  const tab = (shiftKey = false) => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
    const handled = trapTab(event, root);
    return { handled, prevented: event.defaultPrevented };
  };

  it('lists what Tab reaches: not hidden, not disabled', () => {
    expect(focusables(root).map((el) => el.id)).toEqual(['a', 'b', 'd']);
  });
  it('wraps Tab from the last field to the first, and Shift+Tab from the first to the last', () => {
    root.querySelector('#d').focus();
    expect(tab()).toEqual({ handled: true, prevented: true });
    expect(document.activeElement.id).toBe('a');
    expect(tab(true)).toEqual({ handled: true, prevented: true });
    expect(document.activeElement.id).toBe('d');
  });
  it('leaves Tab between fields to the browser', () => {
    root.querySelector('#a').focus();
    expect(tab()).toEqual({ handled: false, prevented: false });
  });
  it('brings focus lost to the page body back into the dialog', () => {
    document.activeElement?.blur();
    expect(tab()).toEqual({ handled: true, prevented: true });
    expect(document.activeElement.id).toBe('a');
  });
  it('leaves focus in a popover or the editor alone', () => {
    outside.focus();
    expect(tab()).toEqual({ handled: false, prevented: false });
    expect(document.activeElement).toBe(outside);
  });
  it('ignores other keys and a dialog with nothing to focus', () => {
    expect(trapTab(new KeyboardEvent('keydown', { key: 'Enter' }), root)).toBe(false);
    expect(trapTab(new KeyboardEvent('keydown', { key: 'Tab' }), null)).toBe(false);
    root.innerHTML = '<p>text only</p>';
    expect(tab().handled).toBe(false);
  });

  // Focus goes back to what opened the dialog: the last element focused or pressed outside any dialog (react-bootstrap
  // has moved focus into the dialog by the time it opens; Safari does not focus a pressed button).
  it('remembers the opener outside dialogs, not the dialog itself', () => {
    watchOpeners();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = '<button id="inside">In</button>';
    document.body.append(modal);
    outside.focus();
    modal.querySelector('#inside').focus();
    expect(openerOf()).toBe(outside);
    const pressed = document.createElement('button');
    document.body.append(pressed);
    pressed.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(openerOf()).toBe(pressed);
    pressed.remove();
    expect(openerOf()).toBeNull();
  });
});
