import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  ANCHOR_PEEK,
  anchorTarget,
  buildMessage,
  isNearBottom,
  sender,
  spacerHeight,
  toRows,
  withRuns,
} from '@/AppBuilder/Widgets/Ui2/Chat/chatModel';

const people = { userName: 'Ada', userAvatar: '', respondentName: 'Assistant', respondentAvatar: 'https://x/bot.png' };
const msg = (messageId, type, message = 'hi', extra = {}) => ({ messageId, type, message, ...extra });

describe('toRows', () => {
  it('keeps objects only, gives unknown types the reply look and makes keys unique', () => {
    const rows = toRows([
      msg('a', 'message'),
      null,
      'text',
      [1],
      msg('a', 'response'),
      { message: 'no id', type: 'nonsense' },
    ]);
    expect(rows.map((r) => r.key)).toEqual(['a', 'a#4', '#5']);
    expect(rows.map((r) => r.type)).toEqual(['message', 'response', 'response']);
  });

  it('never draws an object as message text', () => {
    expect(toRows([{ type: 'response', message: { a: 1 } }])[0].text).toBe('');
    expect(toRows([{ type: 'response', message: 42 }])[0].text).toBe('42');
  });

  it('reads a non-array history as empty', () => {
    expect(toRows(undefined)).toEqual([]);
    expect(toRows({ a: 1 })).toEqual([]);
  });
});

describe('sender and runs', () => {
  it("falls back to the chat's user and respondent", () => {
    expect(sender({ type: 'message', name: '', avatar: '' }, people)).toEqual({ name: 'Ada', avatar: '' });
    expect(sender({ type: 'response', name: '', avatar: '' }, people)).toEqual({
      name: 'Assistant',
      avatar: 'https://x/bot.png',
    });
    expect(sender({ type: 'response', name: 'Bot', avatar: '' }, people).name).toBe('Bot');
  });

  it('marks the first and last row of each run from one sender', () => {
    const rows = withRuns(
      toRows([
        msg('1', 'message'),
        msg('2', 'message'),
        msg('3', 'response'),
        msg('4', 'response'),
        msg('5', 'message'),
      ]),
      people
    );
    expect(rows.map((r) => [r.first, r.last])).toEqual([
      [true, false],
      [false, true],
      [true, false],
      [false, true],
      [true, true],
    ]);
  });
});

describe('anchorTarget', () => {
  const rows = (...ids) => toRows(ids.map(([id, type]) => msg(id, type)));

  it('anchors a user turn appended to an unchanged history', () => {
    expect(anchorTarget(['1'], rows(['1', 'response'], ['2', 'message']))).toBe('2');
  });

  it('anchors the user turn when its reply arrives with it', () => {
    expect(anchorTarget(['1'], rows(['1', 'response'], ['2', 'message'], ['3', 'response']))).toBe('2');
  });

  it('does not anchor a reply, the first draw, a replaced history or a bulk load', () => {
    expect(anchorTarget(['1'], rows(['1', 'message'], ['2', 'response']))).toBeNull();
    expect(anchorTarget(null, rows(['1', 'message']))).toBeNull();
    expect(anchorTarget(['x'], rows(['1', 'response'], ['2', 'message']))).toBeNull();
    expect(
      anchorTarget([], rows(['1', 'message'], ['2', 'response'], ['3', 'message'], ['4', 'response'], ['5', 'message']))
    ).toBeNull();
  });

  it('anchors the first message of an empty chat', () => {
    expect(anchorTarget([], rows(['1', 'message']))).toBe('1');
  });
});

describe('scroll geometry', () => {
  it('leaves room under an anchored turn until the reply fills the view', () => {
    expect(spacerHeight(500, ANCHOR_PEEK, 100)).toBe(500 - 64 - 100);
    expect(spacerHeight(500, ANCHOR_PEEK, 900)).toBe(0);
    expect(spacerHeight(undefined, 'x', null)).toBe(0);
  });

  it('counts a box within the slack of its end as at the end', () => {
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 560, clientHeight: 400 })).toBe(true);
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 300, clientHeight: 400 })).toBe(false);
    expect(isNearBottom(null)).toBe(true);
  });
});

describe('buildMessage', () => {
  it("builds the native Chat's message, defaulting the sender", () => {
    const now = new Date('2026-10-12T10:00:00Z');
    expect(buildMessage({ message: 'Hello', type: 'message' }, people, 'id-1', now)).toEqual({
      message: 'Hello',
      messageId: 'id-1',
      timestamp: '2026-10-12T10:00:00.000Z',
      name: 'Ada',
      avatar: '',
      type: 'message',
    });
    expect(buildMessage({ message: 'Hi', type: 'response', name: 'Bot' }, people, 'id-2', now)).toMatchObject({
      name: 'Bot',
      avatar: 'https://x/bot.png',
    });
  });
});
