/**
 * Chat: the approved contract in
 * frontend/ee/test/app-builder/widgets/Chat/TESTING.md, exercised through the
 * real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Chat + ChatHeader/ChatMessage/ChatInput
 * and the real Markdown renderer. Nothing about the widget is mocked.
 *
 * `capabilities.scrolling` is MANDATORY here and is not decoration: the widget
 * scrolls to its newest message on every history change, and jsdom implements
 * no scrolling API at all — without the stub the widget throws
 * `scrollTo is not a function` and dies in the error boundary as soon as it has
 * one message (contract D-01). The stub supplies only that missing browser
 * plumbing; every element and handler stays real.
 *
 * Deliberately NOT covered here: downloading the conversation (Blob + anchor
 * click) and the smooth scroll itself — Chat-BRW-001..002, QA-owned.
 *
 * Test titles carry their approved scenario ID as a `[Chat-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'ch1';
const NAME = 'chat1';

const GREETING = `{{[{ message: 'Ask me anything!', messageId: 'seed-1', timestamp: '2026-01-01T00:00:00.000Z', name: 'Assistant', avatar: '', type: 'response' }]}}`;

// Baseline is `chat.js`'s own `definition.properties`, copied rather than
// invented, with the sample conversation reduced to one seed message.
const defaultProperties = {
  chatTitle: binding('Support'),
  initialChat: binding(GREETING),
  userName: binding('John'),
  userAvatar: binding(''),
  respondentName: binding('Assistant'),
  respondentAvatar: binding(''),
  visibility: binding('{{true}}'),
  disableInput: binding('{{false}}'),
  loadingHistory: binding('{{false}}'),
  loadingResponse: binding('{{false}}'),
  enableClearHistoryButton: binding('{{true}}'),
  enableDownloadHistoryButton: binding('{{true}}'),
  placeholder: binding('Ask me anything!'),
};

const widget = createWidgetHarness({
  componentType: 'Chat',
  handle: NAME,
  id: ID,
  defaultProperties,
  defaultStyles: {},
  capabilities: { scrolling: true },
  widgetHeight: 400,
  widgetWidth: 400,
});

const user = () => widget.session.user;
const root = () => document.getElementById(ID);
const conversation = () => document.querySelector('.chat-messages');
const bubbles = () => [...document.querySelectorAll('.message-bubble')];
const messageTexts = () => [...document.querySelectorAll('.message-content')].map((node) => node.textContent);
const senderNames = () => [...document.querySelectorAll('.message-title')].map((node) => node.textContent);
const input = () => document.querySelector('textarea');
const sendButton = () => [...document.querySelectorAll('button')].at(-1);
const headerButtons = () => [...document.querySelectorAll('.chat-header button')];
const downloadButton = () => headerButtons()[0];
const clearButton = () => headerButtons()[1];
const exposed = (key) => widget.exposed()?.[key];

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(root()).toBeInTheDocument());
}

const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const ALL_EVENTS = [counting('onMessageSent', 'sent'), counting('onClearHistory', 'cleared')];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('Chat: the conversation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-DATA-001] renders the title, placeholder and initial conversation, and publishes the history', async () => {
    // Break this catches: seeding the conversation from somewhere other than
    // the Initial chat, or publishing a history that disagrees with what is
    // rendered.
    await mount({ properties: { chatTitle: binding('Helpdesk'), placeholder: binding('Type here') } });

    expect(document.querySelector('.chat-title').textContent).toBe('Helpdesk');
    expect(input().placeholder).toBe('Type here');
    expect(messageTexts()).toEqual(['Ask me anything!']);
    await waitFor(() => expect(exposed('history')).toHaveLength(1));
    expect(exposed('history')[0]).toMatchObject({ message: 'Ask me anything!', type: 'response' });
  });

  test('[Chat-DATA-002] rebinding the Initial chat replaces the conversation', async () => {
    // Break this catches: ignoring later resolutions of the binding, so a
    // query-backed conversation never reloads.
    await mount();
    await waitFor(() => expect(messageTexts()).toEqual(['Ask me anything!']));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(
        ID,
        'initialChat',
        `{{[{ message: 'Reloaded', messageId: 'seed-2', timestamp: '2026-01-01T00:00:00.000Z', name: 'Assistant', avatar: '', type: 'response' }]}}`,
        'properties'
      );
    });

    await waitFor(() => expect(messageTexts()).toEqual(['Reloaded']));
    expect(exposed('history')).toHaveLength(1);
  });

  test('[Chat-DATA-003] an Initial chat that is not an array renders an empty conversation, not a crash', async () => {
    // Break this catches: removing the isArray fallback, so a still-loading
    // query binding takes the canvas down.
    await mount({ properties: { initialChat: binding('{{null}}') } });

    expect(root()).toBeInTheDocument();
    expect(bubbles()).toHaveLength(0);
  });
});

describe('Chat: sending messages', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-SEND-001] a sent message is stamped with an id, a timestamp and the user identity', async () => {
    // Break this catches: publishing a message without the id/timestamp the
    // docs promise, or stamping it with the respondent's identity.
    await mount({ events: ALL_EVENTS });

    await user().type(input(), 'Hi there');
    await user().click(sendButton());

    await waitFor(() => expect(messageTexts()).toEqual(['Ask me anything!', 'Hi there']));
    expect(exposed('lastMessage')).toMatchObject({ message: 'Hi there', type: 'message', name: 'John' });
    expect(exposed('lastMessage').messageId).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(exposed('lastMessage').timestamp))).toBe(false);
    expect(input().value).toBe('');
  });

  test('[Chat-SEND-002] sending from the input fires On message sent once, with the button and with Enter', async () => {
    // Break this catches: a second path into fireEvent('onMessageSent') — the
    // event is fired from an effect keyed on the history — which would
    // double-run a builder's AI query per message.
    await mount({ events: ALL_EVENTS });

    await user().type(input(), 'first');
    await user().click(sendButton());
    await waitFor(() => expect(fired('sent')).toBe(1));

    await user().type(input(), 'second{Enter}');

    await waitFor(() => expect(fired('sent')).toBe(2));
    expect(messageTexts()).toEqual(['Ask me anything!', 'first', 'second']);
  });

  test('[Chat-SEND-003] the input refuses to send while empty, disabled, or waiting for a response', async () => {
    // Break this catches: dropping any of the three guards, which lets a user
    // send an empty message or fire a second query while one is in flight.
    await mount({ events: ALL_EVENTS });
    expect(sendButton()).toBeDisabled();

    await mount({ properties: { disableInput: binding('{{true}}') }, events: ALL_EVENTS });
    expect(input()).toBeDisabled();
    expect(sendButton()).toBeDisabled();

    await mount({ properties: { loadingResponse: binding('{{true}}') }, events: ALL_EVENTS });
    await user().type(input(), 'while loading{Enter}');

    expect(fired('sent')).toBe(0);
    expect(messageTexts()).toEqual(['Ask me anything!']);
  });
});

describe('Chat: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-ACT-001] `sendMessage` adds the message without firing On message sent', async () => {
    // Break this catches: firing the event from the CSA, which loops when the
    // CSA is called from inside the builder's own On message sent handler.
    await mount({ events: ALL_EVENTS });

    await widget.act('sendMessage', { message: 'from RunJS', type: 'message' });

    await waitFor(() => expect(messageTexts()).toEqual(['Ask me anything!', 'from RunJS']));
    expect(exposed('lastMessage')).toMatchObject({ message: 'from RunJS', type: 'message' });
    expect(fired('sent')).toBe(0);
  });

  test('[Chat-ACT-002] `appendHistory` routes the message to `lastMessage` or `lastResponse` by its type', async () => {
    // Break this catches: the AI-chatbot flow in the docs — a response appended
    // from a query must land in `lastResponse`, and a user message must not.
    await mount();

    await widget.act('appendHistory', { message: 'the answer', type: 'response' });
    await waitFor(() => expect(exposed('lastResponse')).toMatchObject({ message: 'the answer', type: 'response' }));
    expect(exposed('lastResponse').name).toBe('Assistant');

    await widget.act('appendHistory', { message: 'a question', type: 'message' });

    await waitFor(() => expect(exposed('lastMessage')).toMatchObject({ message: 'a question', type: 'message' }));
    expect(exposed('lastResponse').message).toBe('the answer');
  });

  test('[Chat-ACT-003] `setHistory` replaces the whole conversation', async () => {
    // Break this catches: appending instead of replacing, which duplicates the
    // conversation every time an app restores a saved history.
    await mount();

    await widget.act('setHistory', [
      { message: 'restored one', type: 'message', messageId: 'r1', timestamp: '2026-01-01T00:00:00.000Z' },
      { message: 'restored two', type: 'response', messageId: 'r2', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);

    await waitFor(() => expect(messageTexts()).toEqual(['restored one', 'restored two']));
    expect(exposed('history')).toHaveLength(2);
  });

  test('[Chat-ACT-004] `clearHistory` restores the initial conversation without firing its event', async () => {
    // Break this catches: clearing to an empty panel (the seeded greeting is
    // what a chatbot should come back to), or firing the event from the CSA.
    await mount({ events: ALL_EVENTS });
    await widget.act('sendMessage', { message: 'temporary', type: 'message' });
    await waitFor(() => expect(bubbles()).toHaveLength(2));

    await widget.act('clearHistory');

    await waitFor(() => expect(messageTexts()).toEqual(['Ask me anything!']));
    expect(exposed('history')).toHaveLength(1);
    expect(exposed('lastMessage')).toEqual({});
    expect(fired('cleared')).toBe(0);
  });

  test('[Chat-ACT-005] the CSAs reject a malformed message or history without changing the conversation', async () => {
    // Break this catches: dropping the validators, so a query returning the
    // wrong shape corrupts the conversation instead of being refused.
    await mount();
    await waitFor(() => expect(bubbles()).toHaveLength(1));

    await widget.act('sendMessage', { message: 'no type' });
    await widget.act('sendMessage', { message: 42, type: 'message' });
    await widget.act('appendHistory', { message: 'bad type', type: 'shout' });
    await widget.act('setHistory', 'not-an-array');

    expect(messageTexts()).toEqual(['Ask me anything!']);
    expect(exposed('history')).toHaveLength(1);
  });

  test('[Chat-ACT-006] `setError` shows an error in the conversation until the next history change', async () => {
    // Break this catches: an error that never appears, or one that sticks
    // around after the conversation has moved on.
    await mount();

    await widget.act('setError', 'Something went wrong');
    await waitFor(() => expect(conversation().textContent).toContain('Something went wrong'));

    await widget.act('appendHistory', { message: 'recovered', type: 'response' });

    await waitFor(() => expect(conversation().textContent).toContain('recovered'));
    expect(conversation().textContent).not.toContain('Something went wrong');
  });

  test('[Chat-ACT-007] the avatar CSAs change the identity stamped on later messages', async () => {
    // Break this catches: avatar CSAs that do not reach the message factory, so
    // a per-user avatar set at runtime never appears on their messages.
    await mount();

    await widget.act('setUserAvatar', 'https://example.test/user.png');
    await widget.act('setResponderAvatar', 'https://example.test/bot.png');

    await widget.act('appendHistory', { message: 'mine', type: 'message' });
    await waitFor(() => expect(exposed('lastMessage')?.avatar).toBe('https://example.test/user.png'));

    await widget.act('appendHistory', { message: 'theirs', type: 'response' });

    await waitFor(() => expect(exposed('lastResponse')?.avatar).toBe('https://example.test/bot.png'));
  });
});

describe('Chat: the header controls', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-HEAD-001] the clear button restores the initial conversation and fires On history cleared once', async () => {
    // Break this catches: the user-facing control silently not firing the
    // builder's handler — the CSA deliberately does not, so this path is the
    // only one that does.
    await mount({ events: ALL_EVENTS });
    await user().type(input(), 'to be cleared{Enter}');
    await waitFor(() => expect(bubbles()).toHaveLength(2));

    await user().click(clearButton());

    await waitFor(() => expect(fired('cleared')).toBe(1));
    expect(messageTexts()).toEqual(['Ask me anything!']);
  });

  test('[Chat-HEAD-002] the header buttons are disabled when their toggles are off', async () => {
    // Break this catches: leaving a destructive control live on a board whose
    // builder turned it off.
    await mount();
    expect(downloadButton()).toBeEnabled();
    expect(clearButton()).toBeEnabled();

    await mount({
      properties: {
        enableClearHistoryButton: binding('{{false}}'),
        enableDownloadHistoryButton: binding('{{false}}'),
      },
    });

    expect(downloadButton()).toBeDisabled();
    expect(clearButton()).toBeDisabled();
  });
});

describe('Chat: states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-STATE-001] History loading replaces the conversation with a skeleton and publishes `isHistoryLoading`', async () => {
    // Break this catches: rendering messages beside the skeleton, which shows a
    // stale conversation while the real one is still loading.
    await mount({ properties: { loadingHistory: binding('{{true}}') } });

    expect(bubbles()).toHaveLength(0);
    expect(conversation().querySelector('.custom-gap-16')).toBeTruthy();
    await waitFor(() => expect(exposed('isHistoryLoading')).toBe(true));
  });

  test('[Chat-STATE-002] Response loading shows the respondent indicator and publishes `isResponseLoading`', async () => {
    // Break this catches: no visible sign that an AI query is running, which is
    // the whole point of the documented `isLoading` binding.
    await mount({ properties: { loadingResponse: binding('{{true}}') } });

    expect(conversation().querySelector('.loader')).toBeTruthy();
    expect(messageTexts()).toEqual(['Ask me anything!']);
    await waitFor(() => expect(exposed('isResponseLoading')).toBe(true));
  });

  test('[Chat-STATE-003] Visibility off removes the widget and publishes `isVisible`', async () => {
    // Break this catches: a "hidden" Chat still rendered and interactive.
    widget.render({ currentMode: 'view', properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(document.querySelector('.canvas-component')).toBeInTheDocument());

    expect(root()).toBeNull();
    await waitFor(() => expect(exposed('isVisible')).toBe(false));
  });

  test('[Chat-STATE-004] Disable input state disables the input and publishes `isInputDisabled`', async () => {
    // Break this catches: publishing the disabled state without applying it, so
    // a user types into a field the app believes is locked.
    await mount({ properties: { disableInput: binding('{{true}}') } });

    expect(input()).toBeDisabled();
    await waitFor(() => expect(exposed('isInputDisabled')).toBe(true));
  });

  test('[Chat-STATE-005] the state CSAs take effect and survive an unrelated re-resolve', async () => {
    // Break this catches: a CSA-set state being reverted by an unrelated
    // property change — the re-sync effects are keyed per property, so a
    // widened dependency would clobber it.
    await mount();

    await widget.act('setInputDisable', true);
    await waitFor(() => expect(exposed('isInputDisabled')).toBe(true));
    expect(input()).toBeDisabled();

    await widget.act('setResponseLoading', true);
    await waitFor(() => expect(exposed('isResponseLoading')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'chatTitle', 'Renamed', 'properties');
    });

    expect(exposed('isInputDisabled')).toBe(true);
    expect(input()).toBeDisabled();
    expect(exposed('isResponseLoading')).toBe(true);
  });
});

describe('Chat: styles and compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chat-STYLE-001] the configured container and message colours are applied', async () => {
    // Break this catches: reading a colour from the wrong style key, so a
    // themed Chat renders with defaults.
    await mount({
      styles: {
        containerBackgroundColor: binding('rgb(1, 2, 3)'),
        borderColorContainer: binding('rgb(4, 5, 6)'),
        borderRadius: binding('{{12}}'),
        name: binding('rgb(7, 8, 9)'),
        message: binding('rgb(10, 11, 12)'),
        timestamp: binding('rgb(13, 14, 15)'),
      },
    });

    expect(root().style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(root().style.borderColor).toBe('rgb(4, 5, 6)');
    expect(document.querySelector('.message-title').style.color).toBe('rgb(7, 8, 9)');
    expect(document.querySelector('.message-content').style.color).toBe('rgb(10, 11, 12)');
    expect(document.querySelector('.message-timestamp').style.color).toBe('rgb(13, 14, 15)');
  });

  test('[Chat-STYLE-002] the configured input field colours are applied', async () => {
    // Break this catches: the input ignoring its own style group, which is
    // configured separately from the container.
    await mount({
      styles: {
        backgroundColorField: binding('rgb(20, 21, 22)'),
        borderColorField: binding('rgb(23, 24, 25)'),
        textColorField: binding('rgb(26, 27, 28)'),
      },
    });

    expect(input().style.backgroundColor).toBe('rgb(20, 21, 22)');
    expect(input().style.borderColor).toBe('rgb(23, 24, 25)');
    expect(input().style.color).toBe('rgb(26, 27, 28)');
  });

  test('[Chat-COMPAT-001] a definition predating the placeholder and header toggles still renders and sends', async () => {
    // Break this catches: treating the newer keys as required, which would
    // break every Chat saved before they existed.
    legacyWidget.setup();
    legacyWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(root()).toBeInTheDocument());

    await legacyWidget.session.user.type(input(), 'still works{Enter}');

    await waitFor(() => expect(messageTexts()).toEqual(['Ask me anything!', 'still works']));
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `placeholder` and the header-button toggles
 * existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'Chat',
  handle: NAME,
  id: ID,
  defaultProperties: {
    chatTitle: binding('Support'),
    initialChat: binding(GREETING),
    userName: binding('John'),
    userAvatar: binding(''),
    respondentName: binding('Assistant'),
    respondentAvatar: binding(''),
    visibility: binding('{{true}}'),
    disableInput: binding('{{false}}'),
    loadingHistory: binding('{{false}}'),
    loadingResponse: binding('{{false}}'),
  },
  defaultStyles: {},
  capabilities: { scrolling: true },
  widgetHeight: 400,
  widgetWidth: 400,
});

describe('Chat: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-03): the send path publishes `lastMessage` for
  // EVERY message type (index.js:93-96), while `appendHistory` routes by type.
  // An app answering through `sendMessage({type:'response'})` therefore never
  // updates the documented `lastResponse`. Fix: route by type in the send path
  // exactly as appendHistory already does.
  test.failing('[Chat-BUG-001] `sendMessage` with a response-type message publishes `lastResponse`', async () => {
    await mount();

    await widget.act('sendMessage', { message: 'the answer', type: 'response' });

    await waitFor(() => expect(exposed('history')).toHaveLength(2));
    expect(exposed('lastResponse')).toMatchObject({ message: 'the answer', type: 'response' });
  });

  // BUG (unfixed, contract D-06): four debug `console.log` calls ship in the
  // render path — the message factory (index.js:71), Avatar on every render and
  // image error (Avatar.jsx:9,31) and ChatMessage per message (ChatMessage.jsx:20)
  // — so a busy conversation writes a line per message per render into the
  // user's console. Fix: delete them.
  test.failing('[Chat-BUG-002] rendering a conversation writes no debug output to the console', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await mount();
      await waitFor(() => expect(bubbles()).toHaveLength(1));

      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
    }
  });

  // BUG (unfixed, contract D-07): the Download button carries a `title` and the
  // Clear button carries nothing (ChatHeader.jsx:27-42), so the control that
  // destroys the conversation is announced as an unlabelled button. Fix: give
  // it the matching title.
  test.failing('[Chat-BUG-003] both header buttons carry an accessible name', async () => {
    await mount();

    expect(downloadButton()).toHaveAccessibleName();
    expect(clearButton()).toHaveAccessibleName();
  });
});
