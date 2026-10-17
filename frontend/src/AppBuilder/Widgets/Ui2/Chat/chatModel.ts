import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
// ToolJet UI 2.0 Chat (Chat.tsx): the message and scroll logic, kept free of React so it can be tested. The
// message shape and the validation are the native Chat's (Widgets/Chat/utils/helpers.js).

export type MessageType = 'message' | 'response' | 'error';

export const MESSAGE_TYPES: readonly string[] = ['message', 'response', 'error'];

/** A history entry as bound: the native Chat's message object, any of whose fields may be missing or junk. */
export type ChatEntry = Record<string, unknown>;

/** A message the app sends or appends (sendMessage, appendHistory): the native Chat's shape. */
export interface MessageInput {
  message?: unknown;
  type?: unknown;
  name?: unknown;
  avatar?: unknown;
}

/** The chat's people (its user and respondent names and avatars), as bound. */
export interface ChatPeople {
  userName?: unknown;
  userAvatar?: unknown;
  respondentName?: unknown;
  respondentAvatar?: unknown;
}

/** A row to draw. */
export interface ChatRow {
  key: string;
  type: MessageType;
  text: string;
  name: string;
  avatar: string;
  timestamp: unknown;
  source?: ChatEntry;
}

export interface Sender {
  name: string;
  avatar: string;
}

/** A row with its sender, and whether it starts or ends its sender's run. */
export type RunRow = ChatRow & { who: Sender; first: boolean; last: boolean };
// Rows drawn at once: the newest ones, with a button for earlier messages (a 10,000-message history froze the page).
export const MESSAGES_PER_STEP = 200;
// How close to the end counts as "at the latest message" (px), and how much of the previous message stays visible
// above a new user turn when it moves to the top of the view (shadcn's scrollPreviousItemPeek).
export const BOTTOM_SLACK = 48;
export const ANCHOR_PEEK = 64;

/** A message's text: a string as is, a number or boolean as text, anything else empty (the native Chat refuses a
 *  non-string message with a toast; here a bound junk value just draws an empty bubble). */
export const messageText = (v: unknown): string => (typeof v === 'string' ? v : toText(v));

/** The history as rows to draw: only objects, a known type (else a reply), and a key unique in the list (the
 *  messageId, else the position), so React never sees two rows with one key. */
export const toRows = (history: unknown): ChatRow[] => {
  const list: unknown[] = Array.isArray(history) ? history : [];
  const seen = new Set<string>();
  const rows: ChatRow[] = [];
  list.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const m = entry as ChatEntry;
    const type = typeof m.type === 'string' && MESSAGE_TYPES.includes(m.type) ? (m.type as MessageType) : 'response';
    let key = toText(m.messageId) || `#${index}`;
    if (seen.has(key)) key = `${key}#${index}`;
    seen.add(key);
    rows.push({
      key,
      type,
      text: messageText(m.message),
      name: toText(m.name),
      avatar: toText(m.avatar),
      timestamp: m.timestamp,
      source: m,
    });
  });
  return rows;
};

/** Who sent a row: its own name and avatar, else the chat's user or respondent ones. */
export const sender = (
  row: Pick<ChatRow, 'type' | 'name' | 'avatar'>,
  { userName, userAvatar, respondentName, respondentAvatar }: ChatPeople
): Sender => {
  const mine = row.type === 'message';
  return {
    name: row.name || toText(mine ? userName : respondentName) || (mine ? 'You' : 'Assistant'),
    avatar: row.avatar || toText(mine ? userAvatar : respondentAvatar),
  };
};

/** Consecutive rows from one sender form a run: the name shows on its first row, the avatar beside its last. */
export const withRuns = (rows: ChatRow[], people: ChatPeople): RunRow[] =>
  rows.map((row, i) => {
    const who = sender(row, people);
    const same = (other: ChatRow | undefined) =>
      other && other.type === row.type && sender(other, people).name === who.name;
    return { ...row, who, first: !same(rows[i - 1]), last: !same(rows[i + 1]) };
  });

/** The new user turn to move to the top of the view, or null. Only for messages added at the end of an unchanged
 *  history (a send, an appendHistory): a history replaced or loaded (setHistory, a new initialChat, the first draw)
 *  opens at the end instead. Of the added rows, the last user message is the anchor. */
export const anchorTarget = (previousKeys: string[] | null, rows: ChatRow[]): string | null => {
  if (!Array.isArray(previousKeys)) return null;
  if (rows.length <= previousKeys.length) return null;
  for (let i = 0; i < previousKeys.length; i += 1) if (rows[i].key !== previousKeys[i]) return null;
  const added = rows.slice(previousKeys.length);
  if (added.length > 3) return null;
  const turn = [...added].reverse().find((r) => r.type === 'message');
  return turn ? turn.key : null;
};

/** Room left under an anchored user turn so it can sit `peek` px from the top while its reply is still short: the
 *  view height, less the peek and what is already below the anchor's top. 0 once the reply fills the view. */
export const spacerHeight = (viewportHeight: unknown, peek: unknown, belowAnchor: unknown): number =>
  Math.max(0, Math.round((Number(viewportHeight) || 0) - (Number(peek) || 0) - (Number(belowAnchor) || 0)));

/** Whether a scroll box shows its end (within `slack` px). */
export const isNearBottom = (el: HTMLElement | null, slack: number = BOTTOM_SLACK): boolean =>
  !el || el.scrollHeight - el.scrollTop - el.clientHeight <= slack;

/** A message object the way the native Chat builds one (createMessage): the sender's name and avatar default to
 *  the chat's user or respondent. */
/** A message object as the native Chat stores it. */
export interface ChatMessage {
  message: unknown;
  messageId: string;
  timestamp: string;
  name: unknown;
  avatar: unknown;
  type: unknown;
}

export const buildMessage = (
  messageObject: MessageInput | null | undefined,
  people: ChatPeople,
  id: string,
  now: Date = new Date()
): ChatMessage => {
  const { message, type, name = '', avatar = '' } = messageObject || {};
  const mine = type === 'message';
  return {
    message,
    messageId: id,
    timestamp: now.toISOString(),
    name: name || (mine ? people.userName : people.respondentName),
    avatar: avatar || (mine ? people.userAvatar : people.respondentAvatar),
    type,
  };
};
