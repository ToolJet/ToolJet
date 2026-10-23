// Release audit round 2: Codex's fixture reviewSplitChatIME, kept as written. Chat: the Enter that ends an IME composition (isComposing or keyCode 229) and Shift+Enter keep the draft; a plain Enter sends once.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
const w = createWidgetHarness({
  componentType: 'ShadChat',
  id: 'chat1',
  handle: 'chat1',
  widgetWidth: 600,
  widgetHeight: 480,
});
test.each([
  ['native composition', { isComposing: true }],
  ['IME keyCode229', { keyCode: 229 }],
  ['shift newline', { shiftKey: true }],
])('Chat preserves draft for %s and sends exactly once on ordinary Enter', async (label, extra) => {
  await w.setup();
  try {
    await act(async () => {
      w.render({ currentMode: 'view', properties: { initialChat: binding('{{[]}}') } });
      await new Promise((r) => setTimeout(r, 0));
    });
    const input = screen.getByRole('textbox', { name: 'Message' });
    w.setEvents(countInvocationsOn('chat1', 'onMessageSent', { key: 'sent' }));
    fireEvent.change(input, { target: { value: 'とう' } });
    await act(async () => fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ...extra }));
    expect({ draft: input.value, sent: w.variables().sent ?? 0, history: w.exposed().history.length }).toEqual({
      draft: 'とう',
      sent: 0,
      history: 0,
    });
    await act(async () => fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' }));
    await waitFor(() => expect(w.variables().sent).toBe(1));
    expect(input).toHaveValue('');
    expect(w.exposed().lastMessage.message).toBe('とう');
  } finally {
    w.teardown();
  }
});
