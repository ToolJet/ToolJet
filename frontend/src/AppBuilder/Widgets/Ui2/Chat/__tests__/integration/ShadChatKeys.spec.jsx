/**
 * UI 2.0 Chat gives every message a key of its own, whatever its messageId (release audit 52): a repeated id repaired
 * once could land on another message's id, and a refresh then left a removed message on screen. Titles carry
 * [ShadChat-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { toRows } from '@/AppBuilder/Widgets/Ui2/Chat/chatModel';

const NAMES = ['Alpha', 'Beta', 'Gamma'];
const messages = (ids) => ids.map((messageId, i) => ({ messageId, message: NAMES[i], type: 'response' }));
const keys = (ids) => toRows(messages(ids)).map((r) => r.key);
const unique = (list) => expect(new Set(list).size).toBe(list.length);

describe('UI 2.0 Chat message keys', () => {
  test('[ShadChat-KEY-001] are unique when a repaired key would land on another id, or a missing id on a suffix', () => {
    unique(keys(['a', 'a', 'a']));
    unique(keys(['a#2', 'a', 'a']));
    unique(keys(['#2#2', '#2', undefined]));
    expect(keys(['a#2', 'a', 'a']).slice(0, 2)).toEqual(['a#2', 'a']);
  });

  describe('in the widget', () => {
    const widget = createWidgetHarness({
      componentType: 'ShadChat',
      handle: 'chat1',
      id: 'chat1',
      widgetWidth: 640,
      widgetHeight: 400,
    });
    beforeEach(() => widget.setup());
    afterEach(widget.teardown);

    test('[ShadChat-KEY-002] a refreshed history with repeated ids draws only the new messages', async () => {
      const view = widget.render({
        currentMode: 'view',
        properties: {
          initialChat: binding(`{{${JSON.stringify(messages(['a#2', 'a', 'a']))}}}`),
          showTimestamps: binding('{{false}}'),
        },
      });
      const drawn = () => [...view.container.querySelectorAll('[data-message-key]')].map((el) => el.textContent);
      await waitFor(() => expect(drawn()).toHaveLength(3));
      const next = messages(['a', 'a']).map((m, i) => ({ ...m, message: ['Beta updated', 'Gamma updated'][i] }));
      widget.setComponentProperty('chat1', 'initialChat', `{{${JSON.stringify(next)}}}`, 'properties');
      await waitFor(() => expect(widget.exposed().history).toEqual(next));
      expect(drawn()).toHaveLength(2);
      expect(drawn().join(' ')).not.toContain('Alpha');
    });
  });
});
