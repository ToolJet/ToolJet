import React from 'react';
import { render } from '@testing-library/react';
import useKeyHooks from '../useKeyHooks';

function Harness({ onKey }) {
  useKeyHooks(['esc', 'backspace', 'up, down'], onKey);
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

  test('arrow keys typed inside a shadow root do not reach the callback', () => {
    // Break this catches: the editor nudging a widget while the user arrows through a pack
    // Select's list; retargeting makes event.target the shadow host, so the tag check passes.
    const onKey = jest.fn();
    render(<Harness onKey={onKey} />);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    host.attachShadow({ mode: 'open' }).appendChild(option);

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    option.dispatchEvent(event);
    expect(event.target).toBe(host);
    expect(onKey).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    host.remove();
  });

  test('arrow keys with focus on the body still reach the callback', () => {
    const onKey = jest.fn();
    render(<Harness onKey={onKey} />);
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);
    expect(onKey).toHaveBeenCalledWith('ArrowDown');
  });
});
