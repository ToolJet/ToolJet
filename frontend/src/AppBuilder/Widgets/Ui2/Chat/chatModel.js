// ToolJet UI 2.0 Chat (ShadChat.jsx): the message and scroll logic, kept free of React so it can be tested. The
// message shape and the validation are the native Chat's (Widgets/Chat/utils/helpers.js).

export const MESSAGE_TYPES = ['message', 'response', 'error'];
// Rows drawn at once: the newest ones, with a button for earlier messages (a 10,000-message history froze the page).
export const MESSAGES_PER_STEP = 200;
// How close to the end counts as "at the latest message" (px), and how much of the previous message stays visible
// above a new user turn when it moves to the top of the view (shadcn's scrollPreviousItemPeek).
export const BOTTOM_SLACK = 48;
export const ANCHOR_PEEK = 64;

const text = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

/** A message's text: a string as is, a number or boolean as text, anything else empty (the native Chat refuses a
 *  non-string message with a toast; here a bound junk value just draws an empty bubble). */
export const messageText = (v) => (typeof v === 'string' ? v : text(v));

/** The history as rows to draw: only objects, a known type (else a reply), and a key unique in the list (the
 *  messageId, else the position), so React never sees two rows with one key. */
export const toRows = (history) => {
  const list = Array.isArray(history) ? history : [];
  const seen = new Set();
  const rows = [];
  list.forEach((m, index) => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return;
    const type = MESSAGE_TYPES.includes(m.type) ? m.type : 'response';
    let key = text(m.messageId) || `#${index}`;
    if (seen.has(key)) key = `${key}#${index}`;
    seen.add(key);
    rows.push({
      key,
      type,
      text: messageText(m.message),
      name: text(m.name),
      avatar: text(m.avatar),
      timestamp: m.timestamp,
      source: m,
    });
  });
  return rows;
};

/** Who sent a row: its own name and avatar, else the chat's user or respondent ones. */
export const sender = (row, { userName, userAvatar, respondentName, respondentAvatar }) => {
  const mine = row.type === 'message';
  return {
    name: row.name || text(mine ? userName : respondentName) || (mine ? 'You' : 'Assistant'),
    avatar: row.avatar || text(mine ? userAvatar : respondentAvatar),
  };
};

/** Consecutive rows from one sender form a run: the name shows on its first row, the avatar beside its last. */
export const withRuns = (rows, people) =>
  rows.map((row, i) => {
    const who = sender(row, people);
    const same = (other) => other && other.type === row.type && sender(other, people).name === who.name;
    return { ...row, who, first: !same(rows[i - 1]), last: !same(rows[i + 1]) };
  });

/** The new user turn to move to the top of the view, or null. Only for messages added at the end of an unchanged
 *  history (a send, an appendHistory): a history replaced or loaded (setHistory, a new initialChat, the first draw)
 *  opens at the end instead. Of the added rows, the last user message is the anchor. */
export const anchorTarget = (previousKeys, rows) => {
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
export const spacerHeight = (viewportHeight, peek, belowAnchor) =>
  Math.max(0, Math.round((Number(viewportHeight) || 0) - (Number(peek) || 0) - (Number(belowAnchor) || 0)));

/** Whether a scroll box shows its end (within `slack` px). */
export const isNearBottom = (el, slack = BOTTOM_SLACK) =>
  !el || el.scrollHeight - el.scrollTop - el.clientHeight <= slack;

/** A message object the way the native Chat builds one (createMessage): the sender's name and avatar default to
 *  the chat's user or respondent. */
export const buildMessage = (messageObject, people, id, now = new Date()) => {
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
