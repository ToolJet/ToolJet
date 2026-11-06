import React, { useEffect, useRef } from 'react';
import { render } from '@testing-library/react';
import { isolateInteractiveEvents } from '../InlineLibraryComponent';

// A pack draws into a shadow root on its host; native components dropped into a ToolJet.Slot are the host's
// light-DOM children, projected into the bundle's <slot>. The host stops key and press events from the pack's own
// text fields (the editor's drag and hotkeys cannot see into the shadow root), but a native component in a slot is an
// ordinary ToolJet widget: its keys must still reach React (Text Input fires On enter pressed on keyup).
const Host = ({ onSlotKeyUp }) => {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<input data-own-field /><slot name="body"></slot>';
    return isolateInteractiveEvents(host);
  }, []);
  return (
    <div ref={hostRef}>
      <div slot="body">
        <input data-testid="slot-input" onKeyUp={onSlotKeyUp} />
      </div>
    </div>
  );
};

const keyUp = (target) =>
  target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, composed: true }));

describe('key and press events at a pack host', () => {
  it('lets a native component in a slot receive Enter', () => {
    const onSlotKeyUp = jest.fn();
    const { getByTestId } = render(<Host onSlotKeyUp={onSlotKeyUp} />);
    keyUp(getByTestId('slot-input'));
    expect(onSlotKeyUp).toHaveBeenCalledTimes(1);
    expect(onSlotKeyUp.mock.calls[0][0].key).toBe('Enter');
  });

  it("lets a press on a native component in a slot reach the canvas, which handles it as the widget's own", () => {
    const { getByTestId } = render(<Host onSlotKeyUp={() => {}} />);
    const outside = jest.fn();
    document.addEventListener('mousedown', outside);
    getByTestId('slot-input').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    document.removeEventListener('mousedown', outside);
    expect(outside).toHaveBeenCalledTimes(1);
  });

  it("still stops keys from the pack's own text fields at the host", () => {
    const { container } = render(<Host onSlotKeyUp={() => {}} />);
    const ownField = container.firstChild.shadowRoot.querySelector('[data-own-field]');
    const outside = jest.fn();
    document.addEventListener('keyup', outside);
    keyUp(ownField);
    document.removeEventListener('keyup', outside);
    expect(outside).not.toHaveBeenCalled();
  });
});
