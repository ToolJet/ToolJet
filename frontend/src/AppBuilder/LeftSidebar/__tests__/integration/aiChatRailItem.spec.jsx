import React from 'react';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { render } from '@/test/test-utils';

// The AI chat opens from the first rail item, above Pages, and shows in the left panel like every
// other rail item. There is no floating chat button any more.
const renderSidebar = () =>
  render(
    <BaseLeftSidebar
      renderAISideBarTrigger={({ handleSelectedSidebarItem }) => (
        <button type="button" aria-label="AI agent" onClick={() => handleSelectedSidebarItem('tooljetai')} />
      )}
      renderAIChat={() => <div>AI chat body</div>}
    />
  );

beforeEach(() => {
  act(() => {
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
  });
});

test('puts the AI rail item first, above Pages', () => {
  const { container } = renderSidebar();

  const rail = container.querySelector('.left-sidebar');
  const buttons = within(rail).getAllByRole('button');

  expect(buttons[0]).toHaveAccessibleName('AI agent');
  expect(buttons[1]).toHaveAccessibleName('Pages');
});

test('renders no floating chat button', () => {
  const { container } = renderSidebar();

  expect(container.querySelector('.ai-builder-fab')).toBeNull();
  expect(screen.getAllByRole('button', { name: 'AI agent' })).toHaveLength(1);
});

test('opens the chat in the left panel and closes it from its rail icon', async () => {
  renderSidebar();

  await userEvent.click(screen.getByRole('button', { name: 'AI agent' }));

  expect(screen.getByText('AI chat body').closest('.sidebar-h-100-popover')).not.toBeNull();
  expect(useStore.getState()).toMatchObject({ selectedSidebarItem: 'tooljetai', isSidebarOpen: true });

  await userEvent.click(screen.getByRole('button', { name: 'AI agent' }));

  expect(useStore.getState().isSidebarOpen).toBe(false);
});
