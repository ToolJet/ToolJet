import React from 'react';
import { act } from '@testing-library/react';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { PANEL_MOTION } from '@/AppBuilder/panelLayout';
import { render } from '@/test/test-utils';

// Closing a left panel clears the selected rail item straight away, but the panel has to stay on
// screen, showing what it showed, for the exit animation (data-state="closed") before it unmounts.
const panel = () => document.querySelector('.sidebar-h-100-popover');

beforeEach(() => {
  jest.useFakeTimers();
  act(() => {
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test('keeps the closing panel and its content mounted while it animates out', () => {
  render(<BaseLeftSidebar renderAIChat={() => <div>AI chat body</div>} />);
  act(() => useStore.getState().setAiChatOpen(true));
  expect(panel()).toHaveAttribute('data-state', 'open');

  act(() => useStore.getState().setAiChatOpen(false));

  expect(useStore.getState().selectedSidebarItem).toBeNull();
  expect(panel()).toHaveAttribute('data-state', 'closed');
  expect(panel()).toHaveClass('tooljetai');
  expect(panel()).toHaveTextContent('AI chat body');

  act(() => jest.advanceTimersByTime(PANEL_MOTION.durationMs));

  expect(panel()).toBeNull();
});
