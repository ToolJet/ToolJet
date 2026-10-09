import React from 'react';
import { render } from '@testing-library/react';
import useKeyHooks from '../useKeyHooks';

function Harness({ onKey }) {
  useKeyHooks(['esc', 'backspace'], onKey);
  return <div data-testid="h" />;
}

function pressOnDocument(key, code) {
  const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

describe('useKeyHooks', () => {
  test('Escape reaches the callback without being default-prevented', () => {
    // Break this catches: preventDefault() on every bound key. A default-prevented Escape
    // makes modal/overlay handlers that check `e.defaultPrevented` (ModalV2, Modal) treat
    // the keypress as already consumed, so Escape stops closing modals in the editor.
    const onKey = jest.fn();
    render(<Harness onKey={onKey} />);

    const escape = pressOnDocument('Escape', 'Escape');
    expect(onKey).toHaveBeenCalledWith('Escape');
    expect(escape.defaultPrevented).toBe(false);
  });

  test('other bound keys are still default-prevented so the browser action is suppressed', () => {
    // Break this catches: dropping preventDefault entirely, which would let Backspace
    // navigate back and Ctrl/Cmd shortcuts reach the browser.
    const onKey = jest.fn();
    render(<Harness onKey={onKey} />);

    const backspace = pressOnDocument('Backspace', 'Backspace');
    expect(onKey).toHaveBeenCalledWith('Backspace');
    expect(backspace.defaultPrevented).toBe(true);
  });
});
