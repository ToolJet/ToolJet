import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PreviewSettings from '../PreviewSettings';

jest.mock('@/AppBuilder/_stores/store', () => {
  const state = { setShowUndoRedoBtn: () => {}, editingVersion: null, selectedVersion: null };
  const useStore = (select) => select(state);
  useStore.getState = () => state;
  return { __esModule: true, default: useStore };
});
jest.mock('@/AppBuilder/Header/HeaderActions', () => ({
  __esModule: true,
  default: () => <div>width and layout</div>,
}));
jest.mock('@/AppBuilder/_contexts/ModuleContext', () => ({ useAppType: () => 'front-end' }));

// QA 2026-11-05: in Preview of a code app, the settings stayed open over the app after a click in it. The app runs in
// a frame, so the click never reached this document and rootClose never heard it.
describe('Preview settings', () => {
  it('close when focus moves into the app frame, as on any outside click', async () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    try {
      render(<PreviewSettings isMobileLayout={false} showHeader darkMode={false} />);
      fireEvent.click(document.querySelector('[data-cy="preview-settings"]'));
      expect(await screen.findByText('Preview settings')).toBeInTheDocument();
      frame.focus();
      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      await waitFor(() => expect(screen.queryByText('Preview settings')).toBeNull());
    } finally {
      frame.remove();
    }
  });
});
