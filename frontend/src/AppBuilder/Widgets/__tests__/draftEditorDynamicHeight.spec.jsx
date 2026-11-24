import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { DraftEditor } from '../DraftEditor';

// With dynamic height the editor area's minimum must leave room for the toolbar as measured, like the fixed-height
// path does; a taller (wrapped) toolbar otherwise makes an empty editor taller than authored.
test('[RichTextEditor-DH-001] the dynamic-height editor area minimum subtracts the measured toolbar', async () => {
  // Break this catches: a fixed "height - 60" minimum that ignores the toolbar's real height.
  const OriginalResizeObserver = global.ResizeObserver;
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([]);
    }
    unobserve() {}
    disconnect() {}
  };
  const offsetHeight = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
    return this.classList.contains('RichEditor-controls') ? 70 : 0;
  });
  try {
    const { container } = render(
      <DraftEditor
        height={200}
        isDynamicHeightEnabled
        defaultValue=""
        placeholder=""
        handleChange={() => {}}
        setExposedVariable={() => {}}
        setExposedVariables={() => {}}
        setIsDisabled={() => {}}
        setIsVisible={() => {}}
        setIsLoading={() => {}}
        isInitialRender={{ current: true }}
      />
    );
    const editorArea = container.querySelector('.RichEditor-controls').nextElementSibling;

    await waitFor(() => expect(editorArea).toHaveStyle({ minHeight: `${200 - 46 - 70}px` }));
  } finally {
    offsetHeight.mockRestore();
    global.ResizeObserver = OriginalResizeObserver;
  }
});
