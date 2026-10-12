import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ShadChat } from '../ShadChat';
import { ShadQuestionnaire } from '../ShadQuestionnaire';

// The ToolJet UI 2.0 Chat (the native Chat's API in the pack's look, with Message Scroller scrolling) and the
// Questionnaire, mounted the way RenderWidget mounts them.

const harness = (Widget, componentType, properties) => {
  const exposed = {};
  const fired = [];
  const props = (p) => ({
    id: 'w1',
    componentType,
    height: 480,
    width: 600,
    properties: p,
    styles: {},
    setExposedVariables: (v) => Object.assign(exposed, v),
    setExposedVariable: (k, v) => (exposed[k] = v),
    // What a handler would read when the event runs.
    fireEvent: (name) => fired.push([name, JSON.parse(JSON.stringify(exposed))]),
  });
  const view = render(<Widget {...props(properties)} />);
  return {
    exposed,
    fired,
    rerender: (p) => view.rerender(<Widget {...props(p)} />),
    call: async (handle, ...args) => {
      await act(async () => {
        await exposed[handle](...args);
      });
    },
  };
};

// ---- Chat ------------------------------------------------------------------------------------------------------------

const CHAT = {
  chatTitle: 'Support',
  initialChat: [
    { message: 'Hi! **Ask** me anything.', messageId: 'm1', type: 'response', name: 'Assistant' },
    { message: 'Where is my order?', messageId: 'm2', type: 'message', name: 'Ada' },
  ],
  userName: 'Ada',
  userAvatar: '',
  respondentName: 'Assistant',
  respondentAvatar: '',
  placeholder: 'Ask me anything!',
  emptyText: 'Start the conversation',
  disableInput: false,
  loadingHistory: false,
  loadingResponse: false,
  enableClearHistoryButton: true,
  enableDownloadHistoryButton: true,
  showAvatars: true,
  showTimestamps: true,
  visibility: true,
  disabledState: false,
  loadingState: false,
};
const mountChat = (extra = {}) => harness(ShadChat, 'ShadChat', { ...CHAT, ...extra });
const rows = () => Array.from(document.querySelectorAll('[data-message-key]'));
const input = () => screen.getByRole('textbox', { name: 'Message' });

describe('ShadChat', () => {
  it('draws user turns on the right and replies on the left with markdown', () => {
    mountChat();
    expect(rows().map((r) => [r.getAttribute('data-type'), r.getAttribute('data-align')])).toEqual([
      ['response', 'start'],
      ['message', 'end'],
    ]);
    expect(rows()[0].querySelector('.sc-markdown')).not.toBeNull();
    expect(rows()[1].querySelector('.sc-markdown')).toBeNull();
    expect(screen.getByText('Support')).toBeTruthy();
    expect(screen.getAllByText('Assistant').length).toBeGreaterThan(0);
  });

  it('sends on Enter, exposing lastMessage before onMessageSent runs', () => {
    const chat = mountChat();
    fireEvent.change(input(), { target: { value: 'Track order 1042' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(rows()).toHaveLength(3);
    expect(chat.exposed.history).toHaveLength(3);
    const [name, seen] = chat.fired.at(-1);
    expect(name).toBe('onMessageSent');
    expect(seen.lastMessage).toMatchObject({ message: 'Track order 1042', type: 'message', name: 'Ada' });
    expect(input().value).toBe('');
  });

  it('keeps Shift+Enter as a new line and sends nothing blank', () => {
    const chat = mountChat();
    fireEvent.change(input(), { target: { value: '   ' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    fireEvent.change(input(), { target: { value: 'two' } });
    fireEvent.keyDown(input(), { key: 'Enter', shiftKey: true });
    expect(chat.fired).toEqual([]);
    expect(screen.getByRole('button', { name: 'Send message' }).disabled).toBe(false);
  });

  it("runs the native Chat's actions", async () => {
    const chat = mountChat();
    await chat.call('appendHistory', { message: 'It ships today.', type: 'response' });
    expect(chat.exposed.lastResponse).toMatchObject({ message: 'It ships today.', name: 'Assistant' });
    await chat.call('sendMessage', { message: 'Thanks', type: 'message' });
    expect(chat.exposed.lastMessage.message).toBe('Thanks');
    expect(chat.fired).toEqual([]); // sendMessage leaves onMessageSent to the app
    await chat.call('appendHistory', { message: 42, type: 'response' }); // refused, as natively
    expect(chat.exposed.history).toHaveLength(4);

    await chat.call('setResponseLoading', true);
    expect(chat.exposed.isResponseLoading).toBe(true);
    expect(screen.getByRole('status', { name: 'Assistant is typing' })).toBeTruthy();
    await chat.call('setInputDisable', true);
    expect(input().disabled).toBe(true);
    expect(chat.exposed.isInputDisabled).toBe(true);

    await chat.call('setError', 'The model timed out.');
    expect(screen.getByText('The model timed out.')).toBeTruthy();

    await chat.call('setHistory', [{ message: 'Fresh', type: 'response', messageId: 'f' }]);
    expect(rows()).toHaveLength(1);
    await chat.call('setHistoryLoading', true);
    expect(screen.getByLabelText('Loading messages')).toBeTruthy();
    expect(chat.exposed.isHistoryLoading).toBe(true);

    await chat.call('clearHistory');
    expect(chat.exposed.history).toHaveLength(2);
    expect(chat.exposed.lastMessage).toEqual({});
  });

  it('clears to the initial chat from the header and fires onClearHistory', () => {
    const chat = mountChat();
    fireEvent.change(input(), { target: { value: 'One more' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(rows()).toHaveLength(2);
    expect(chat.fired.at(-1)[0]).toBe('onClearHistory');
  });

  it('shows the empty text for an empty chat and hides the header with nothing in it', () => {
    mountChat({ initialChat: [], chatTitle: '', enableClearHistoryButton: false, enableDownloadHistoryButton: false });
    expect(screen.getByText('Start the conversation')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear history' })).toBeNull();
  });

  it('draws the newest 200 messages of a long history', () => {
    const long = Array.from({ length: 1000 }, (_, i) => ({ message: `m${i}`, messageId: `k${i}`, type: 'response' }));
    mountChat({ initialChat: long });
    expect(rows()).toHaveLength(200);
    fireEvent.click(screen.getByText('Show 200 earlier messages'));
    expect(rows()).toHaveLength(400);
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
    const content = () => document.querySelector('[role=log]');
    const viewport = () => screen.getByRole('region', { name: 'Messages' });
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
        const spacer = parseFloat(this.querySelector('[data-chat-spacer]')?.style.height || '0');
        return content().children.length * ROW + spacer;
      });
      saved.scrollTo = Element.prototype.scrollTo;
      Element.prototype.scrollTo = function scrollTo({ top }) {
        const max = this.scrollHeight - this.clientHeight;
        this.scrollTop = Math.max(0, Math.min(max, top));
      };
    });
    afterEach(() => {
      for (const name of ['offsetTop', 'offsetHeight']) Object.defineProperty(HTMLElement.prototype, name, saved[name]);
      for (const name of ['clientHeight', 'scrollHeight']) Object.defineProperty(Element.prototype, name, saved[name]);
      Element.prototype.scrollTo = saved.scrollTo;
    });
    const history = (n) =>
      Array.from({ length: n }, (_, i) => ({
        message: `m${i}`,
        messageId: `h${i}`,
        type: i % 2 ? 'message' : 'response',
        name: i % 2 ? 'Ada' : 'Bot',
      }));

    it('opens at the latest message', () => {
      mountChat({ initialChat: history(10) });
      expect(viewport().scrollTop).toBe(10 * ROW - VIEW);
    });

    it('moves a new user turn near the top, leaving room for its reply', async () => {
      const chat = mountChat({ initialChat: history(10) });
      fireEvent.change(input(), { target: { value: 'New question' } });
      fireEvent.keyDown(input(), { key: 'Enter' });
      // The turn is row 10 (top 1000): it sits 64px below the top, with the room under it the view still needs.
      expect(viewport().scrollTop).toBe(1000 - 64);
      expect(document.querySelector('[data-chat-spacer]').style.height).toBe(`${VIEW - 64 - ROW}px`);
      // The reply arrives under it: the view does not move until the reply fills the view.
      await chat.call('appendHistory', { message: 'Answer', type: 'response' });
      expect(viewport().scrollTop).toBe(1000 - 64);
    });

    it('never moves a reader who scrolled up, and offers Jump to latest', async () => {
      const chat = mountChat({ initialChat: history(10) });
      const jump = screen.getByRole('button', { name: 'Jump to latest', hidden: true });
      expect(jump.getAttribute('data-active')).toBe('false');
      fireEvent.wheel(viewport(), { deltaY: -120 });
      viewport().scrollTop = 200;
      fireEvent.scroll(viewport());
      expect(jump.getAttribute('data-active')).toBe('true');
      await chat.call('appendHistory', { message: 'More', type: 'response' });
      expect(viewport().scrollTop).toBe(200);
      fireEvent.click(jump);
      expect(viewport().scrollTop).toBe(11 * ROW - VIEW);
    });
  });
});

// ---- Questionnaire ---------------------------------------------------------------------------------------------------

const QUESTIONS = {
  items: [
    {
      name: 'role',
      prompt: 'What best describes your role?',
      required: true,
      type: 'single',
      choices: [{ label: 'Operations', description: 'Day-to-day work' }, 'Finance'],
      other: true,
    },
    { name: 'goals', prompt: 'Goals?', type: 'multiple', choices: ['Track orders', 'Approve requests'] },
    { name: 'notes', prompt: 'Anything else?', type: 'text', required: true },
  ],
  defaultAnswers: {},
  shortcuts: 'letters',
  showProgress: true,
  submitLabel: 'Save plan',
  completeTitle: 'All set',
  completeText: 'We saved your answers.',
  surface: 'card',
  visibility: true,
  disabledState: false,
  loadingState: false,
};
const mountQ = (extra = {}) => harness(ShadQuestionnaire, 'ShadQuestionnaire', { ...QUESTIONS, ...extra });
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

describe('ShadQuestionnaire', () => {
  it('shows one question with its progress, answers and shortcuts', () => {
    const q = mountQ();
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'AOperationsDay-to-day work',
      'BFinance',
      'COther',
    ]);
    expect(q.exposed).toMatchObject({
      currentIndex: 0,
      isComplete: false,
      answers: { role: null, goals: [], notes: '' },
    });
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  });

  it('blocks Next on a required question until it is answered', () => {
    const q = mountQ();
    click('Next');
    expect(screen.getByRole('alert').textContent).toBe('Choose an answer to continue.');
    expect(q.fired).toEqual([]);
    fireEvent.click(screen.getByRole('radio', { name: /Finance/ }));
    expect(screen.queryByRole('alert')).toBeNull();
    click('Next');
    expect(screen.getByText('Question 2 of 3')).toBeTruthy();
    const [name, seen] = q.fired.at(-1);
    expect(name).toBe('onStepChange');
    expect(seen).toMatchObject({ currentIndex: 1, answers: { role: 'Finance' }, currentItem: { name: 'goals' } });
  });

  it('picks answers by shortcut and takes Other as typed text', () => {
    const q = mountQ();
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'b' });
    expect(screen.getByRole('radio', { name: /Finance/ }).getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(group, { key: 'c' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Other' }), { target: { value: 'Legal' } });
    expect(q.exposed.answers.role).toBe('Legal');
  });

  it('skips an optional question and goes back with Previous', () => {
    const q = mountQ({ defaultAnswers: { role: 'Finance', goals: ['Track orders'] } });
    click('Next');
    click('Skip');
    expect(screen.getByText('Question 3 of 3')).toBeTruthy();
    expect(q.exposed.answers.goals).toEqual([]);
    click('Previous');
    expect(screen.getByText('Question 2 of 3')).toBeTruthy();
  });

  it('validates on submit, then completes and fires onSubmit with the answers', () => {
    const q = mountQ({ defaultAnswers: { role: 'Operations' } });
    click('Next');
    click('Next');
    click('Save plan');
    expect(screen.getByRole('alert').textContent).toBe('Enter an answer to continue.');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Weekly report' } });
    click('Save plan');
    expect(screen.getByText('All set')).toBeTruthy();
    const [name, seen] = q.fired.at(-1);
    expect(name).toBe('onSubmit');
    expect(seen).toMatchObject({
      isComplete: true,
      answers: { role: 'Operations', goals: [], notes: 'Weekly report' },
    });
  });

  it('jumps back to the first unanswered required question on submit', async () => {
    const q = mountQ();
    await q.call('goTo', 'notes');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    click('Save plan');
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Choose an answer to continue.');
  });

  it('answers goTo and reset', async () => {
    const q = mountQ({ defaultAnswers: { role: 'Finance' } });
    await q.call('goTo', 2);
    expect(q.exposed.currentIndex).toBe(2);
    expect(q.fired.at(-1)[0]).toBe('onStepChange');
    await q.call('goTo', 'nope');
    expect(q.exposed.currentIndex).toBe(2);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Note' } });
    await q.call('reset');
    expect(q.exposed).toMatchObject({ currentIndex: 0, isComplete: false, answers: { role: 'Finance', notes: '' } });
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
  });

  it('starts over when its items change', () => {
    const q = mountQ();
    fireEvent.click(screen.getByRole('radio', { name: /Finance/ }));
    click('Next');
    q.rerender({ ...QUESTIONS, items: [{ name: 'only', prompt: 'Only one?', choices: ['Yes', 'No'] }] });
    expect(screen.getByText('Question 1 of 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeTruthy();
  });

  it('draws junk items as no questions', () => {
    mountQ({ items: 'not a list' });
    expect(screen.getByText('No questions yet')).toBeTruthy();
  });
});
