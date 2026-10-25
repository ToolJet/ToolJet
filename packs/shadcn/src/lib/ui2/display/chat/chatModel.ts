import { toText } from './values';
// UI 2.0 Chat's message logic (Ui2/Chat/chatModel.ts and the native Chat's helpers), free of React. A message is the
// native Chat's object: { message, messageId, timestamp, name, avatar, type: 'message' | 'response' | 'error' }. The
// pack's earlier shape ({ role: 'user' | 'assistant', message | content }) still reads.

export type MessageType = 'message' | 'response' | 'error';
export const MESSAGE_TYPES: readonly string[] = ['message', 'response', 'error'];
/** Rows drawn at once: the newest ones, with a button for earlier messages. */
export const MESSAGES_PER_STEP = 200;
/** How close to the end counts as at the latest message (px). */
export const BOTTOM_SLACK = 48;

export interface ChatPeople {
  userName?: unknown;
  userAvatar?: unknown;
  respondentName?: unknown;
  respondentAvatar?: unknown;
}

export interface ChatMessage {
  message: unknown;
  messageId: string;
  timestamp: string;
  name: unknown;
  avatar: unknown;
  type: unknown;
}

export interface ChatRow {
  key: string;
  type: MessageType;
  text: string;
  name: string;
  avatar: string;
  timestamp: unknown;
}

export interface Sender {
  name: string;
  avatar: string;
}

export type RunRow = ChatRow & { who: Sender; first: boolean; last: boolean };

const typeOf = (m: Record<string, unknown>): MessageType => {
  if (typeof m.type === 'string' && MESSAGE_TYPES.includes(m.type)) return m.type as MessageType;
  if (m.role === 'user') return 'message';
  return 'response';
};

/** The history as rows to draw: objects only, a known type (else a reply), and a key unique in the list. */
export const toRows = (history: unknown): ChatRow[] => {
  const list: unknown[] = Array.isArray(history) ? history : [];
  const rows: ChatRow[] = [];
  const used = new Set<string>();
  list.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const m = entry as Record<string, unknown>;
    let key = toText(m.messageId) || `#${index}`;
    for (let n = 2; used.has(key); n += 1) key = `${toText(m.messageId) || `#${index}`}#${n}`;
    used.add(key);
    const body = m.message ?? m.content;
    rows.push({
      key,
      type: typeOf(m),
      text: typeof body === 'string' ? body : toText(body),
      name: toText(m.name),
      avatar: toText(m.avatar),
      timestamp: m.timestamp,
    });
  });
  return rows;
};

/** Who sent a row: its own name and avatar, else the chat's user or respondent ones. */
export const sender = (row: Pick<ChatRow, 'type' | 'name' | 'avatar'>, people: ChatPeople): Sender => {
  const mine = row.type === 'message';
  return {
    name: row.name || toText(mine ? people.userName : people.respondentName) || (mine ? 'You' : 'Assistant'),
    avatar: row.avatar || toText(mine ? people.userAvatar : people.respondentAvatar),
  };
};

/** Consecutive rows from one sender form a run: the name shows on its first row, the avatar beside its last. */
export const withRuns = (rows: ChatRow[], people: ChatPeople): RunRow[] =>
  rows.map((row, i) => {
    const who = sender(row, people);
    const same = (other: ChatRow | undefined) => other && other.type === row.type && sender(other, people).name === who.name;
    return { ...row, who, first: !same(rows[i - 1]), last: !same(rows[i + 1]) };
  });

/** A message the app sends or appends: the native Chat's object, or plain text as a message of `fallbackType`, or the
 *  pack's earlier { role, message } shape. null when it is no message (a junk binding). */
export const toMessageInput = (
  raw: unknown,
  fallbackType: MessageType
): { message: string; type: MessageType; name: unknown; avatar: unknown } | null => {
  if (typeof raw === 'string') return raw.trim() ? { message: raw, type: fallbackType, name: '', avatar: '' } : null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;
  const body = m.message ?? m.content;
  if (typeof body !== 'string') return null;
  const type =
    typeof m.type === 'string'
      ? MESSAGE_TYPES.includes(m.type)
        ? (m.type as MessageType)
        : null
      : m.role === 'user'
      ? 'message'
      : m.role === 'assistant'
      ? 'response'
      : fallbackType;
  if (!type) return null;
  return { message: body, type, name: m.name ?? '', avatar: m.avatar ?? '' };
};

let counter = 0;
const newId = (): string => {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  counter += 1;
  return `msg-${Date.now().toString(36)}-${counter}`;
};

/** A message object the way the native Chat builds one: the sender's name and avatar default to the chat's people. */
export const buildMessage = (
  input: { message: unknown; type: unknown; name?: unknown; avatar?: unknown },
  people: ChatPeople,
  now: Date = new Date()
): ChatMessage => {
  const mine = input.type === 'message';
  return {
    message: input.message,
    messageId: newId(),
    timestamp: now.toISOString(),
    name: input.name || (mine ? people.userName : people.respondentName),
    avatar: input.avatar || (mine ? people.userAvatar : people.respondentAvatar),
    type: input.type,
  };
};

// The sample history's timestamps are the literal text 'new Date().toISOString()' (the native Chat's sample); they read
// as the moment the pack loaded.
const NOW_LITERAL = 'new Date().toISOString()';
const LOADED_AT = new Date().toISOString();

/** The native Chat's time label: the time for today, else the date and time; --/-- for no valid time. */
export const formatTimestamp = (timestamp: unknown): string => {
  const value = timestamp === NOW_LITERAL ? LOADED_AT : timestamp;
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) return '--/--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--/--';
  if (date.toDateString() === new Date().toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Whether a scroll box shows its end (within `slack` px). */
export const isNearBottom = (el: HTMLElement | null, slack: number = BOTTOM_SLACK): boolean =>
  !el || el.scrollHeight - el.scrollTop - el.clientHeight <= slack;
