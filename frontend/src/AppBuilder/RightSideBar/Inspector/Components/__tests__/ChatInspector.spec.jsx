/**
 * Chat has its own inspector panel that lists its Additional Actions by hand, so a toggle added to the
 * config does not appear unless the panel renders it too. Collapse when hidden must sit right after
 * Visibility in that section. The real panel, accordion and controls render against the real store.
 */
import { Chat } from '../Chat';
import { createInspectorPanelHarness, renderedControls } from './inspectorPanelHarness';

const panel = createInspectorPanelHarness({ componentType: 'Chat', Panel: Chat });

describe('Chat inspector', () => {
  beforeEach(() => panel.setup());

  test('draws Collapse when hidden in Additional Actions, right after Visibility', async () => {
    panel.render();

    const controls = await renderedControls('additional-actions');
    // Both must be present before their order means anything: if Visibility vanished, -1 + 1 would match a
    // Collapse toggle that had become the first control.
    expect(controls).toContain('visibility');
    expect(controls).toContain('collapse-when-hidden');
    expect(controls.indexOf('collapse-when-hidden')).toBe(controls.indexOf('visibility') + 1);
  });
});
