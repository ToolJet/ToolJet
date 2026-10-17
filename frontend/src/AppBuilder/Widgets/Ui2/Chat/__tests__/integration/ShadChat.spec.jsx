/**
 * UI 2.0 Chat: the native Chat's API in the pack's look, with Message Scroller scrolling.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked (jsdom's missing layout and Blob URLs
 * are given values where a scenario needs them). Standard control behaviour (visibility, disabled, loading, tooltip) is
 * covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx; this file covers what the Chat itself does.
 * Titles carry [ShadChat-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'chat1';
const CHAT =
  "{{[{ message: 'Hi! **Ask** me anything.', messageId: 'm1', type: 'response' }, { message: 'Where is my order?', messageId: 'm2', type: 'message' }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadChat',
  handle: 'chat1',
  id: ID,
  widgetHeight: 480,
  widgetWidth: 600,
  defaultProperties: { chatTitle: binding('Support'), initialChat: binding(CHAT), userName: binding('Ada') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rows = () => [...document.querySelectorAll('[data-message-key]')];
const input = () => screen.getByRole('textbox', { name: 'Message' });
const exposed = () => widget.exposed() ?? {};
const send = (text) => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key: 'Enter' });
};
const history = (n) =>
  `{{Array.from({ length: ${n} }, (_, i) => ({ message: 'm' + i, messageId: 'h' + i, type: i % 2 ? 'message' : 'response', name: i % 2 ? 'Ada' : 'Bot' }))}}`;

describe('UI 2.0 Chat', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadChat-DEF-001] draws replies on the left in markdown and user turns on the right, under the chatTitle', async () => {
    render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows().map((r) => [r.getAttribute('data-type'), r.getAttribute('data-align')])).toEqual([
      ['response', 'start'],
      ['message', 'end'],
    ]);
    expect(rows()[0].querySelector('.sc-markdown')).not.toBeNull();
    expect(rows()[1].querySelector('.sc-markdown')).toBeNull();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(input()).toHaveAttribute('placeholder', 'Ask me anything!');
    await waitFor(() => expect(exposed().history).toHaveLength(2));
    expect(exposed()).toMatchObject({
      lastMessage: {},
      lastResponse: {},
      isHistoryLoading: false,
      isResponseLoading: false,
      isInputDisabled: false,
    });
  });

  test('[ShadChat-PROP-001] userName, respondentName and their avatars name messages that carry none of their own', async () => {
    render({
      properties: {
        respondentName: binding('Grace'),
        userAvatar: binding('https://example.com/ada.png'),
        respondentAvatar: binding(''),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[0]).toHaveTextContent('Grace');
    expect(rows()[0].querySelector('[data-fallback="initials"]')).toHaveTextContent('G');
    expect(rows()[1]).toHaveTextContent('Ada');
    expect(rows()[1].querySelector('img')).toHaveAttribute('src', 'https://example.com/ada.png');
  });

  test('[ShadChat-PROP-002] showAvatars and showTimestamps off leave the name alone', async () => {
    render({
      properties: {
        showAvatars: binding('{{false}}'),
        showTimestamps: binding('{{false}}'),
        initialChat: binding(
          "{{[{ message: 'Hello', messageId: 'a', type: 'response', timestamp: '2026-10-16T09:30:00' }]}}"
        ),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0].querySelector('[data-fallback], img')).toBeNull();
    expect(rows()[0].querySelector('.tw-tabular-nums')).toBeNull();
  });

  test('[ShadChat-EVT-001] Enter sends the draft, exposing lastMessage before onMessageSent runs', async () => {
    render({ properties: { placeholder: binding('Type here') } });
    widget.setEvents(setVariableOn(ID, 'onMessageSent', { value: '{{components.chat1.lastMessage.message}}' }));

    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Type here'));
    send('Track order 1042');

    await waitFor(() => expect(widget.variables().seen).toBe('Track order 1042'));
    expect(rows()).toHaveLength(3);
    expect(exposed().history).toHaveLength(3);
    expect(exposed().lastMessage).toMatchObject({ type: 'message', name: 'Ada' });
    expect(input()).toHaveValue('');
  });

  test('[ShadChat-KBD-001] Shift+Enter keeps a new line, and a blank draft sends nothing', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onMessageSent'));

    await waitFor(() => expect(rows()).toHaveLength(2));
    send('   ');
    fireEvent.change(input(), { target: { value: 'two' } });
    fireEvent.keyDown(input(), { key: 'Enter', shiftKey: true });
    expect(rows()).toHaveLength(2);
    expect(widget.variables().calls).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Send message' })).not.toBeDisabled();
  });

  test('[ShadChat-EVT-002] the header clear button restores the initial chat and fires onClearHistory', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onClearHistory', { value: '{{components.chat1.history.length}}' }));

    await waitFor(() => expect(rows()).toHaveLength(2));
    send('One more');
    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));

    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(rows()).toHaveLength(2);
  });

  test('[ShadChat-PROP-003] emptyText shows for an empty chat; no title and no header buttons hide the header', async () => {
    render({
      properties: {
        initialChat: binding('{{[]}}'),
        chatTitle: binding(''),
        emptyText: binding('Say hello'),
        enableClearHistoryButton: binding('{{false}}'),
        enableDownloadHistoryButton: binding('{{false}}'),
      },
    });

    expect(await screen.findByText('Say hello')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear history' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download chat history' })).toBeNull();
  });

  test('[ShadChat-PROP-004] disableInput, loadingHistory and loadingResponse lock the box and show their states', async () => {
    render({
      properties: {
        disableInput: binding('{{true}}'),
        loadingHistory: binding('{{true}}'),
        loadingResponse: binding('{{true}}'),
      },
    });

    await waitFor(() => expect(input()).toBeDisabled());
    expect(screen.getByLabelText('Loading messages')).toBeInTheDocument();
    await waitFor(() => expect(exposed()).toMatchObject({ isInputDisabled: true, isHistoryLoading: true }));
    expect(exposed().isResponseLoading).toBe(true);
  });

  test('[ShadChat-ACT-001] appendHistory records a reply as lastResponse; sendMessage adds a turn without firing onMessageSent', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onMessageSent'));

    await widget.act('appendHistory', { message: 'It ships today.', type: 'response' });
    await waitFor(() =>
      expect(exposed().lastResponse).toMatchObject({ message: 'It ships today.', name: 'Assistant' })
    );
    await widget.act('sendMessage', { message: 'Thanks', type: 'message' });
    await waitFor(() => expect(exposed().lastMessage.message).toBe('Thanks'));
    expect(widget.variables().calls).toBeUndefined();
    // A message that is not text is refused, as natively.
    await widget.act('appendHistory', { message: 42, type: 'response' });
    expect(exposed().history).toHaveLength(4);
    expect(rows()).toHaveLength(4);
  });

  test('[ShadChat-ACT-002] setResponseLoading, setInputDisable and setHistoryLoading switch the states they name', async () => {
    render();

    await widget.act('setResponseLoading', true);
    await waitFor(() => expect(exposed().isResponseLoading).toBe(true));
    expect(screen.getByRole('status', { name: 'Assistant is typing' })).toBeInTheDocument();
    await widget.act('setInputDisable', true);
    await waitFor(() => expect(input()).toBeDisabled());
    expect(exposed().isInputDisabled).toBe(true);
    await widget.act('setHistoryLoading', true);
    await waitFor(() => expect(screen.getByLabelText('Loading messages')).toBeInTheDocument());
    expect(exposed().isHistoryLoading).toBe(true);
  });

  test('[ShadChat-ACT-003] setError shows an error turn; setHistory replaces the history; clearHistory restores the initial one', async () => {
    render();

    await widget.act('setError', 'The model timed out.');
    expect(await screen.findByText('The model timed out.')).toBeInTheDocument();
    await widget.act('setHistory', [{ message: 'Fresh', type: 'response', messageId: 'f' }]);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.queryByText('The model timed out.')).toBeNull();
    await widget.act('clearHistory');
    await waitFor(() => expect(exposed().history).toHaveLength(2));
    expect(exposed().lastMessage).toEqual({});
  });

  test('[ShadChat-ACT-004] setResponderAvatar and setUserAvatar change the avatars beside the turns', async () => {
    render();

    await widget.act('setResponderAvatar', 'https://example.com/bot.png');
    await waitFor(() => expect(rows()[0].querySelector('img')).toHaveAttribute('src', 'https://example.com/bot.png'));
    await widget.act('setUserAvatar', 'https://example.com/me.png');
    await waitFor(() => expect(rows()[1].querySelector('img')).toHaveAttribute('src', 'https://example.com/me.png'));
  });

  test('[ShadChat-ACT-005] downloadChat and the header button save the history as a JSON file', async () => {
    const saved = [];
    const created = jest.fn(() => 'blob:chat');
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: jest.fn() });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function save() {
      saved.push(this.download);
    });
    try {
      render();
      await widget.act('downloadChat');
      fireEvent.click(screen.getByRole('button', { name: 'Download chat history' }));
      expect(saved).toHaveLength(2);
      expect(saved[0]).toMatch(/^chat-history-.*\.json$/);
      expect(created.mock.calls[0][0].type).toBe('application/json');
    } finally {
      clickSpy.mockRestore();
      delete URL.createObjectURL;
      delete URL.revokeObjectURL;
    }
  });

  test('[ShadChat-DEF-002] draws the newest 200 messages of a long history, 200 earlier ones per press', async () => {
    render({ properties: { initialChat: binding(history(1000)) } });

    await waitFor(() => expect(rows()).toHaveLength(200));
    fireEvent.click(screen.getByText('Show 200 earlier messages'));
    await waitFor(() => expect(rows()).toHaveLength(400));
  });

  describe('scrolling', () => {
    // jsdom has no layout: rows are 100px tall, stacked; the message view is 400px tall.
    const ROW = 100;
    const VIEW = 400;
    const saved = {};
    const define = (proto, name, get) => {
      saved[name] = Object.getOwnPropertyDescriptor(proto, name);
      Object.defineProperty(proto, name, { configurable: true, get });
    };
    const log = () => document.querySelector('[role=log]');
    const viewport = () => screen.getByRole('region', { name: 'Messages' });
    const spacer = () => document.querySelector('[data-chat-spacer]').style.height;
    beforeEach(() => {
      define(HTMLElement.prototype, 'offsetTop', function offsetTop() {
        const parent = this.parentElement;
        return parent && parent.getAttribute('role') === 'log' ? Array.from(parent.children).indexOf(this) * ROW : 0;
      });
      define(HTMLElement.prototype, 'offsetHeight', function offsetHeight() {
        return this.getAttribute('role') === 'log' ? this.children.length * ROW : ROW;
      });
      define(Element.prototype, 'clientHeight', function clientHeight() {
        return this.getAttribute('role') === 'region' ? VIEW : 0;
      });
      define(Element.prototype, 'scrollHeight', function scrollHeight() {
        if (this.getAttribute('role') !== 'region') return 0;
        return log().children.length * ROW + parseFloat(this.querySelector('[data-chat-spacer]')?.style.height || '0');
      });
      saved.scrollTo = Element.prototype.scrollTo;
      Element.prototype.scrollTo = function scrollTo({ top }) {
        this.scrollTop = Math.max(0, Math.min(this.scrollHeight - this.clientHeight, top));
      };
    });
    afterEach(() => {
      for (const name of ['offsetTop', 'offsetHeight']) Object.defineProperty(HTMLElement.prototype, name, saved[name]);
      for (const name of ['clientHeight', 'scrollHeight']) Object.defineProperty(Element.prototype, name, saved[name]);
      Element.prototype.scrollTo = saved.scrollTo;
    });

    test('[ShadChat-DEF-003] opens at the latest message', async () => {
      render({ properties: { initialChat: binding(history(10)) } });

      await waitFor(() => expect(viewport().scrollTop).toBe(10 * ROW - VIEW));
    });

    test('[ShadChat-DEF-004] lifts a new user turn near the top, leaving room under it for the reply', async () => {
      render({ properties: { initialChat: binding(history(10)) } });

      await waitFor(() => expect(rows()).toHaveLength(10));
      send('New question');
      // The turn is row 10 (top 1000): it sits 64px below the top, with the room under it the view still needs.
      await waitFor(() => expect(viewport().scrollTop).toBe(1000 - 64));
      expect(spacer()).toBe(`${VIEW - 64 - ROW}px`);
      await widget.act('appendHistory', { message: 'Answer', type: 'response' });
      expect(viewport().scrollTop).toBe(1000 - 64);
    });

    // A history bound to a query is empty on the first draw; its rows arriving is a load, not a send: the view goes
    // to the end and no user turn is lifted to the top (a short thread showed its last turn at the top over blank room).
    test('[ShadChat-DEF-005] a history that loads after the first draw opens at its end, as does a refresh', async () => {
      render({ properties: { initialChat: binding('{{[]}}') } });
      await screen.findByText('Start the conversation');

      widget.setComponentProperty(ID, 'initialChat', history(3), 'properties');
      await waitFor(() => expect(rows()).toHaveLength(3));
      expect(viewport().scrollTop).toBe(0);
      expect(spacer()).toBe('0px');
      widget.setComponentProperty(ID, 'initialChat', history(5), 'properties');
      await waitFor(() => expect(viewport().scrollTop).toBe(5 * ROW - VIEW));
      expect(spacer()).toBe('0px');
    });

    test('[ShadChat-DEF-006] never moves a reader who scrolled up, and offers Jump to latest', async () => {
      render({ properties: { initialChat: binding(history(10)) } });

      const jump = await screen.findByRole('button', { name: 'Jump to latest', hidden: true });
      expect(jump).toHaveAttribute('data-active', 'false');
      fireEvent.wheel(viewport(), { deltaY: -120 });
      viewport().scrollTop = 200;
      fireEvent.scroll(viewport());
      await waitFor(() => expect(jump).toHaveAttribute('data-active', 'true'));
      await widget.act('appendHistory', { message: 'More', type: 'response' });
      expect(viewport().scrollTop).toBe(200);
      fireEvent.click(jump);
      expect(viewport().scrollTop).toBe(11 * ROW - VIEW);
    });
  });

  test('[ShadChat-STY-001] container, bubble, name, message and field styles reach the chat as CSS variables', async () => {
    const { container } = render({
      styles: {
        containerBackgroundColor: binding('#ffffff'),
        borderColorContainer: binding('#e5e7eb'),
        borderRadius: binding('{{12}}'),
        accentColorField: binding('#2563eb'),
        responseBubbleColor: binding('#f1f5f9'),
        name: binding('#0f172a'),
        message: binding('#334155'),
        timestamp: binding('#94a3b8'),
        backgroundColorField: binding('#f8fafc'),
        borderColorField: binding('#cbd5e1'),
        textColorField: binding('#111827'),
        sendIconColorField: binding('#16a34a'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-accent')).toBe('#2563eb'));
    expect(
      ['--lk-bg', '--lk-border', '--lk-radius', '--lk-bubble', '--lk-name', '--lk-fg', '--lk-muted'].map((v) =>
        root.style.getPropertyValue(v)
      )
    ).toEqual(['#ffffff', '#e5e7eb', '12px', '#f1f5f9', '#0f172a', '#334155', '#94a3b8']);
    expect(
      ['--lk-field-bg', '--lk-field-border', '--lk-field-fg', '--lk-send'].map((v) => root.style.getPropertyValue(v))
    ).toEqual(['#f8fafc', '#cbd5e1', '#111827', '#16a34a']);
  });
});
