// Row actions drawn as icons in the Table's ToolJet UI 2.0 look (a button column's buttonDisplay 'icons' or 'menu'):
// the icon a button shows when it names none, read from its label's first verb, and whether the action destroys
// something (drawn in the destructive colour). Pure, so the column width and the cell agree.
const ICONS = [
  [/\b(delete|remove|trash|discard|destroy)\b/, 'trash'],
  [/\b(edit|update|modify|change|rename)\b/, 'pencil'],
  [/\b(view|open|details?|preview|show|inspect)\b/, 'eye'],
  [/\b(approve|confirm|accept|complete|done|resolve|mark (as )?(done|complete|paid))\b/, 'check'],
  [/\b(reject|decline|deny|cancel|close|dismiss|void)\b/, 'x'],
  [/\b(download|export)\b/, 'download'],
  [/\b(copy|duplicate|clone)\b/, 'copy'],
  [/\b(send|email|mail|message|notify|remind)\b/, 'send'],
  [/\b(share)\b/, 'share'],
  [/\b(archive)\b/, 'archive'],
  [/\b(call|phone|dial)\b/, 'phone'],
  [/\b(assign|invite|add (user|member))\b/, 'user-plus'],
  [/\b(print)\b/, 'printer'],
  [/\b(link|url)\b/, 'link'],
  [/\b(restore|undo|refund|revert|reopen)\b/, 'rotate'],
  [/\b(star|favou?rite|pin)\b/, 'star'],
  [/\b(add|new|create)\b/, 'plus'],
];
const DESTRUCTIVE = /\b(delete|remove|trash|discard|destroy|reject|decline|deny|void)\b/;

/** The icon for a row action's label: a name from ICONS, or '' when no verb is known. */
export const actionIcon = (label) => {
  const text = String(label ?? '').toLowerCase();
  return ICONS.find(([re]) => re.test(text))?.[1] || '';
};

/** True when the label names an action that destroys or refuses something. */
export const isDestructive = (label) => DESTRUCTIVE.test(String(label ?? '').toLowerCase());

/** How a button column draws its buttons: 'icons', 'menu', or 'buttons' (also for anything else). */
export const buttonDisplayOf = (value) => (value === 'icons' || value === 'menu' ? value : 'buttons');
