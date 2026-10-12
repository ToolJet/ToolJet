// ToolJet UI 2.0 Questionnaire (ShadQuestionnaire.jsx): items, answers and validation, kept free of React so they can be
// tested. An answer is held as { selected, other, otherOn, text } and exposed as one value per item name.

export const MAX_ITEMS = 100;
export const MAX_CHOICES = 50;
export const TYPES = ['single', 'multiple', 'text'];

const text = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
const isText = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const on = (v) => v === true || v === 'true';

const toChoices = (choices) => {
  const seen = new Set();
  const out = [];
  for (const c of Array.isArray(choices) ? choices : []) {
    if (out.length >= MAX_CHOICES) break;
    let choice;
    if (isText(c)) choice = { label: String(c), value: c, description: '' };
    else if (c && typeof c === 'object' && !Array.isArray(c)) {
      const value = isText(c.value) ? c.value : isText(c.label) ? c.label : null;
      if (value === null) continue;
      choice = { label: isText(c.label) ? String(c.label) : String(value), value, description: text(c.description) };
    } else continue;
    const key = String(choice.value);
    if (!choice.label.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(choice);
  }
  return out;
};

const toOther = (other) => {
  if (on(other)) return { label: 'Other', placeholder: 'Type your answer' };
  if (other && typeof other === 'object' && !Array.isArray(other))
    return { label: text(other.label) || 'Other', placeholder: text(other.placeholder) || 'Type your answer' };
  return null;
};

/** The items as questions to draw: objects only (up to MAX_ITEMS), a unique name (else question1, question2, ...),
 *  a known type (choices make an unset type single, no choices make it text), and choices as { label, value,
 *  description } with duplicates and blanks dropped. A choice question with no choices and no Other becomes text. */
export const normalizeItems = (items) => {
  const names = new Set();
  const out = [];
  for (const raw of Array.isArray(items) ? items : []) {
    if (out.length >= MAX_ITEMS) break;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    let name = text(raw.name).trim() || `question${out.length + 1}`;
    if (names.has(name)) {
      let n = 2;
      while (names.has(`${name}_${n}`)) n += 1;
      name = `${name}_${n}`;
    }
    names.add(name);
    const choices = toChoices(raw.choices);
    const other = toOther(raw.other);
    let type = TYPES.includes(raw.type) ? raw.type : choices.length ? 'single' : 'text';
    if (type !== 'text' && !choices.length && !other) type = 'text';
    out.push({
      name,
      prompt: text(raw.prompt) || text(raw.label) || name,
      description: text(raw.description),
      required: on(raw.required),
      type,
      choices: type === 'text' ? [] : choices,
      other: type === 'text' ? null : other,
      placeholder: text(raw.placeholder),
    });
  }
  return out;
};

export const emptyAnswer = (item) => ({
  selected: item.type === 'multiple' ? [] : null,
  other: '',
  otherOn: false,
  text: '',
});

const sameValue = (a, b) => String(a) === String(b);

/** An answer from a saved value (defaultAnswers): a choice's value selects it; a value that is no choice fills Other
 *  when the question has one. */
export const answerFrom = (item, value) => {
  const answer = emptyAnswer(item);
  if (value === undefined || value === null) return answer;
  if (item.type === 'text') return { ...answer, text: isText(value) ? String(value) : '' };
  const values = item.type === 'multiple' ? (Array.isArray(value) ? value : [value]) : [value];
  const selected = [];
  let other = '';
  for (const v of values) {
    if (!isText(v)) continue;
    const choice = item.choices.find((c) => sameValue(c.value, v));
    if (choice) selected.push(choice.value);
    else if (item.other && String(v).trim()) other = String(v);
  }
  if (item.type === 'single') {
    if (selected.length) return { ...answer, selected: selected[0] };
    return other ? { ...answer, other, otherOn: true } : answer;
  }
  return { ...answer, selected, other, otherOn: !!other };
};

export const initialAnswers = (items, defaults) => {
  const saved = defaults && typeof defaults === 'object' && !Array.isArray(defaults) ? defaults : {};
  return Object.fromEntries(items.map((item) => [item.name, answerFrom(item, saved[item.name])]));
};

/** What the questionnaire exposes for one item: the chosen value (single), the list of chosen values (multiple, with
 *  the Other text last), the text (text). Other stands for the typed text. */
export const answerValue = (item, answer = emptyAnswer(item)) => {
  const other = answer.otherOn ? answer.other.trim() : '';
  if (item.type === 'text') return answer.text;
  if (item.type === 'multiple') return [...(answer.selected || []), ...(other ? [other] : [])];
  if (answer.otherOn) return other || null;
  return answer.selected ?? null;
};

export const answersOf = (items, answers) =>
  Object.fromEntries(items.map((item) => [item.name, answerValue(item, answers[item.name])]));

export const isAnswered = (item, answer = emptyAnswer(item)) => {
  if (item.type === 'text') return answer.text.trim() !== '';
  const other = answer.otherOn && answer.other.trim() !== '';
  if (item.type === 'multiple') return (answer.selected || []).length > 0 || other;
  return answer.otherOn ? other : answer.selected !== null && answer.selected !== undefined;
};

/** Why the item cannot move on, or '' when it can: a required item needs an answer, and an Other that is chosen
 *  needs its text (an empty Other on an optional item is no answer, not an error). */
export const problem = (item, answer = emptyAnswer(item)) => {
  if (isAnswered(item, answer)) return '';
  if (!item.required) return '';
  if (item.type === 'text') return 'Enter an answer to continue.';
  if (answer.otherOn && !(answer.selected || []).length) return 'Type your answer to continue.';
  return item.type === 'multiple' ? 'Choose at least one answer to continue.' : 'Choose an answer to continue.';
};

/** The first item that blocks a submit, or -1. */
export const firstProblem = (items, answers) => items.findIndex((item) => problem(item, answers[item.name]) !== '');

/** Picks a choice: single selects it (and leaves Other), multiple toggles it. */
export const pick = (item, answer, value) => {
  if (item.type === 'single') return { ...answer, selected: value, otherOn: false };
  const selected = answer.selected || [];
  return {
    ...answer,
    selected: selected.some((v) => sameValue(v, value))
      ? selected.filter((v) => !sameValue(v, value))
      : [...selected, value],
  };
};

/** Picks Other: single moves the answer to it, multiple toggles it beside the choices. */
export const pickOther = (item, answer) =>
  item.type === 'single' ? { ...answer, selected: null, otherOn: true } : { ...answer, otherOn: !answer.otherOn };

export const isPicked = (item, answer, value) =>
  item.type === 'multiple'
    ? (answer.selected || []).some((v) => sameValue(v, value))
    : !answer.otherOn && answer.selected !== null && sameValue(answer.selected, value);

/** The shortcut shown on the answer at `index`: A..Z (letters) or 1..9 (numbers); none past those or when off. */
export const shortcutKey = (index, mode) => {
  if (mode === 'numbers') return index < 9 ? String(index + 1) : null;
  if (mode === 'none') return null;
  return index < 26 ? String.fromCharCode(65 + index) : null;
};

/** The answer a pressed key picks, or -1. */
export const keyIndex = (key, mode, count) => {
  if (typeof key !== 'string' || key.length !== 1) return -1;
  for (let i = 0; i < count; i += 1) if (shortcutKey(i, mode) === key.toUpperCase()) return i;
  return -1;
};

/** goTo's argument as an item index: a position (a number, or a numeric string) or an item's name; null for anything
 *  else. A position past either end goes to the nearest item. */
export const resolveIndex = (arg, items) => {
  if (!items.length) return null;
  if (typeof arg === 'string' && arg.trim() && !Number.isFinite(Number(arg))) {
    const i = items.findIndex((item) => item.name === arg.trim());
    return i === -1 ? null : i;
  }
  const n = typeof arg === 'number' ? arg : typeof arg === 'string' && arg.trim() ? Number(arg) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(items.length - 1, Math.trunc(n)));
};
