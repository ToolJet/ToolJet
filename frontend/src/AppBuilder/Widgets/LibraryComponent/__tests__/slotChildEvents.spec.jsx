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
    root.innerHTML =
      '<input data-own-field /><span role="slider" tabindex="0" data-own-thumb></span><slot name="body"></slot>';
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
const keyDown = (target, key, extra = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, ...extra }));

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

  // A slider thumb, an open select list or a calendar day takes focus without being a text field. The editor's
  // shortcuts listen on the document, where the event's target is the host, so they took its keys: ArrowRight moved the
  // selected widget, Backspace asked to delete it, Cmd+C copied it and Cmd+A selected the whole canvas.
  it.each([
    ['ArrowRight', {}],
    ['Backspace', {}],
    ['c', { metaKey: true }],
    ['a', { ctrlKey: true }],
  ])("stops %s from the pack's own focused control (not a text field) at the host", (key, extra) => {
    const { container } = render(<Host onSlotKeyUp={() => {}} />);
    const thumb = container.firstChild.shadowRoot.querySelector('[data-own-thumb]');
    const outside = jest.fn();
    document.addEventListener('keydown', outside);
    keyDown(thumb, key, extra);
    document.removeEventListener('keydown', outside);
    expect(outside).not.toHaveBeenCalled();
  });

  it('lets the pack handle its own keys before the host stops them', () => {
    const { container } = render(<Host onSlotKeyUp={() => {}} />);
    const thumb = container.firstChild.shadowRoot.querySelector('[data-own-thumb]');
    const own = jest.fn();
    thumb.addEventListener('keydown', own);
    keyDown(thumb, 'ArrowRight');
    expect(own).toHaveBeenCalledTimes(1);
  });

  it("lets Escape from the pack's own control out, so a ToolJet Modal around it still closes", () => {
    const { container } = render(<Host onSlotKeyUp={() => {}} />);
    const thumb = container.firstChild.shadowRoot.querySelector('[data-own-thumb]');
    const outside = jest.fn();
    document.addEventListener('keydown', outside);
    keyDown(thumb, 'Escape');
    document.removeEventListener('keydown', outside);
    expect(outside).toHaveBeenCalledTimes(1);
  });

  it('leaves keys from a native component in a slot to the editor', () => {
    const { getByTestId } = render(<Host onSlotKeyUp={() => {}} />);
    const outside = jest.fn();
    document.addEventListener('keydown', outside);
    keyDown(getByTestId('slot-input'), 'ArrowRight');
    document.removeEventListener('keydown', outside);
    expect(outside).toHaveBeenCalledTimes(1);
  });
});
