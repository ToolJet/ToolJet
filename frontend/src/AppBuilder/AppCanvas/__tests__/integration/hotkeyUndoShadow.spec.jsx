import React from 'react';
import { render, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { HotkeyProvider } from '@/AppBuilder/AppCanvas/HotkeyProvider';

// Undo/redo typed inside a pack component's shadow root belong to that component, not the editor.
describe('HotkeyProvider undo and redo', () => {
  let handleUndo;
  let handleRedo;

  beforeEach(() => {
    handleUndo = jest.fn();
    handleRedo = jest.fn();
    act(() => {
      useStore.setState({ handleUndo, handleRedo, isEditorReadOnly: false, isEditorOverlayOpen: false });
    });
  });

  const mount = () =>
    render(
      <HotkeyProvider mode="edit" currentLayout="desktop" canvasMaxWidth={1292}>
        <div />
      </HotkeyProvider>
    );

  const press = (target, init) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init });
    act(() => {
      target.dispatchEvent(event);
    });
    return event;
  };

  const shadowInput = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const input = document.createElement('input');
    host.attachShadow({ mode: 'open' }).appendChild(input);
    return { host, input };
  };

  test('Cmd+Z and Cmd+Shift+Z typed in an input inside a shadow root do not undo or redo the editor', () => {
    mount();
    const { host, input } = shadowInput();
    const undo = press(input, { key: 'z', code: 'KeyZ', metaKey: true });
    const redo = press(input, { key: 'z', code: 'KeyZ', metaKey: true, shiftKey: true });
    expect(undo.target).toBe(host);
    expect(handleUndo).not.toHaveBeenCalled();
    expect(handleRedo).not.toHaveBeenCalled();
    host.remove();
  });

  test('Cmd+Z with focus on the body still undoes', () => {
    mount();
    press(document.body, { key: 'z', code: 'KeyZ', metaKey: true });
    expect(handleUndo).toHaveBeenCalled();
  });
});
