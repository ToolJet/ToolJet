// Release audit round 3 (Codex fixture reviewHeadingLiveSizeClamp, trimmed): a fixed-height Heading counts the lines
// that fit from its line height. A font size change alone left the old count (5 lines of 12px text in a box that now
// holds 1 line of 64px text), so the heading spilled until its text changed.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadHeading',
  id: 'heading1',
  handle: 'heading1',
  widgetHeight: 80,
  widgetWidth: 500,
});

// jsdom has no layout: the measured line height follows the font size the widget sets, as a browser's does.
let computed;
beforeEach(async () => {
  await w.setup();
  const original = window.getComputedStyle.bind(window);
  computed = jest.spyOn(window, 'getComputedStyle').mockImplementation((node, ...args) => {
    const result = original(node, ...args);
    if (node.tagName === 'H2') {
      const size = parseFloat(node.closest('.tj-shadcn').style.getPropertyValue('--lk-size')) || 30;
      Object.defineProperty(result, 'lineHeight', { configurable: true, value: `${size * 1.2}px` });
    }
    return result;
  });
});
afterEach(() => {
  computed.mockRestore();
  w.teardown();
});

const mount = async () => {
  w.render({
    currentMode: 'view',
    properties: { text: binding('Quarterly report'), level: binding('h2'), dynamicHeight: binding('{{false}}') },
    styles: { fontSize: binding('{{12}}') },
  });
  const heading = await screen.findByRole('heading', { name: 'Quarterly report' });
  await waitFor(() => expect(heading.style.WebkitLineClamp).toBe('5'));
  return heading;
};

test('[UI2-AUDIT-HEADING-002] a font size change alone recounts the lines a fixed-height heading shows', async () => {
  const heading = await mount();
  await act(async () => w.setComponentProperty('heading1', 'fontSize', '{{64}}', 'styles'));
  expect(heading.closest('.tj-shadcn').style.getPropertyValue('--lk-size')).toBe('64px');
  await waitFor(() => expect(heading.style.WebkitLineClamp).toBe('1'));
});
