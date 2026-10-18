import { isScalar, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
// ToolJet UI 2.0 Questionnaire (Questionnaire.tsx): items, answers and validation, kept free of React so they can be
// tested. An answer is held as { selected, other, otherOn, text } and exposed as one value per item name.

/** A question draws this many choices, and this many more per press of Show more (every item and choice is kept: a
 *  required 101st question was dropped and never blocked the submit). */
export const CHOICES_PER_STEP = 50;
export const TYPES: readonly string[] = ['single', 'multiple', 'text'];

/** A choice's value as bound: text, a number or a boolean. */
export type ChoiceValue = string | number | boolean;

export interface Choice {
  label: string;
  value: ChoiceValue;
  description: string;
}

export interface OtherSpec {
  label: string;
  placeholder: string;
}

export type QuestionType = 'single' | 'multiple' | 'text';

/** A question to draw (normalizeItems). */
export interface QuestionItem {
  name: string;
  prompt: string;
  description: string;
  required: boolean;
  type: QuestionType;
  choices: Choice[];
  other: OtherSpec | null;
  placeholder: string;
  multiline: boolean;
}

/** An answer as held: the chosen value (single, else null) or values (multiple), the Other text and whether Other is
 *  chosen, and the text (a text question). */
export interface Answer {
  selected: ChoiceValue | ChoiceValue[] | null;
  other: string;
  otherOn: boolean;
  text: string;
}

export type Answers = Record<string, Answer>;

/** The value exposed for one item (answerValue). */
export type AnswerValue = string | ChoiceValue[] | ChoiceValue | null;

/** A multiple question's chosen values (a single question's selection is not a list: none). */
const chosen = (answer: Answer): ChoiceValue[] => (Array.isArray(answer.selected) ? answer.selected : []);

const on = (v: unknown): boolean => v === true || v === 'true';

const toChoices = (choices: unknown): Choice[] => {
  const seen = new Set<string>();
  const out: Choice[] = [];
  for (const c of Array.isArray(choices) ? (choices as unknown[]) : []) {
    let choice: Choice;
    if (isScalar(c)) choice = { label: String(c), value: c, description: '' };
    else if (c && typeof c === 'object' && !Array.isArray(c)) {
      const { value: v, label, description } = c as Record<string, unknown>;
      const value = isScalar(v) ? v : isScalar(label) ? label : null;
      if (value === null) continue;
      choice = { label: isScalar(label) ? String(label) : String(value), value, description: toText(description) };
    } else continue;
    const key = String(choice.value);
    if (!choice.label.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(choice);
  }
  return out;
};

const toOther = (other: unknown): OtherSpec | null => {
  if (on(other)) return { label: 'Other', placeholder: 'Type your answer' };
  if (other && typeof other === 'object' && !Array.isArray(other)) {
    const { label, placeholder } = other as Record<string, unknown>;
    return { label: toText(label) || 'Other', placeholder: toText(placeholder) || 'Type your answer' };
  }
  return null;
};

/** The items as questions to draw: objects only (all of them, one drawn at a time), a unique name (else question1, question2, ...),
 *  a known type (choices make an unset type single, no choices make it text), and choices as { label, value,
 *  description } with duplicates and blanks dropped. A choice question with no choices and no Other becomes text. */
export const normalizeItems = (items: unknown): QuestionItem[] => {
  const names = new Set<string>();
  const out: QuestionItem[] = [];
  for (const raw of Array.isArray(items) ? (items as Record<string, unknown>[]) : []) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    let name = toText(raw.name).trim() || `question${out.length + 1}`;
    if (names.has(name)) {
      let n = 2;
      while (names.has(`${name}_${n}`)) n += 1;
      name = `${name}_${n}`;
    }
    names.add(name);
    const choices = toChoices(raw.choices);
    const other = toOther(raw.other);
    let type: QuestionType =
      typeof raw.type === 'string' && TYPES.includes(raw.type)
        ? (raw.type as QuestionType)
        : choices.length
        ? 'single'
        : 'text';
    if (type !== 'text' && !choices.length && !other) type = 'text';
    out.push({
      name,
      prompt: toText(raw.prompt) || toText(raw.label) || name,
      description: toText(raw.description),
      required: on(raw.required),
      type,
      choices: type === 'text' ? [] : choices,
      other: type === 'text' ? null : other,
      placeholder: toText(raw.placeholder),
      // A text answer is a box of several lines unless multiline is false (a name, an email, a number: one line).
      multiline: type === 'text' ? raw.multiline !== false && raw.multiline !== 'false' : false,
    });
  }
  return out;
};

export const emptyAnswer = (item: QuestionItem): Answer => ({
  selected: item.type === 'multiple' ? [] : null,
  other: '',
  otherOn: false,
  text: '',
});

const sameValue = (a: unknown, b: unknown): boolean => String(a) === String(b);

/** An answer from a saved value (defaultAnswers): a choice's value selects it; a value that is no choice fills Other
 *  when the question has one. */
export const answerFrom = (item: QuestionItem, value: unknown): Answer => {
  const answer = emptyAnswer(item);
  if (value === undefined || value === null) return answer;
  if (item.type === 'text') return { ...answer, text: isScalar(value) ? String(value) : '' };
  const values: unknown[] = item.type === 'multiple' ? (Array.isArray(value) ? value : [value]) : [value];
  const selected: ChoiceValue[] = [];
  let other = '';
  for (const v of values) {
    if (!isScalar(v)) continue;
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

export const initialAnswers = (items: QuestionItem[], defaults: unknown): Answers => {
  const saved: Record<string, unknown> =
    defaults && typeof defaults === 'object' && !Array.isArray(defaults) ? (defaults as Record<string, unknown>) : {};
  return Object.fromEntries(items.map((item) => [item.name, answerFrom(item, saved[item.name])]));
};

/** What the questionnaire exposes for one item: the chosen value (single), the list of chosen values (multiple, with
 *  the Other text last), the text (text). Other stands for the typed text. */
export const answerValue = (item: QuestionItem, answer: Answer = emptyAnswer(item)): AnswerValue => {
  const other = answer.otherOn ? answer.other.trim() : '';
  if (item.type === 'text') return answer.text;
  if (item.type === 'multiple') return [...chosen(answer), ...(other ? [other] : [])];
  if (answer.otherOn) return other || null;
  return answer.selected ?? null;
};

export const answersOf = (items: QuestionItem[], answers: Answers): Record<string, AnswerValue> =>
  Object.fromEntries(items.map((item) => [item.name, answerValue(item, answers[item.name])]));

export const isAnswered = (item: QuestionItem, answer: Answer = emptyAnswer(item)): boolean => {
  if (item.type === 'text') return answer.text.trim() !== '';
  const other = answer.otherOn && answer.other.trim() !== '';
  if (item.type === 'multiple') return chosen(answer).length > 0 || other;
  return answer.otherOn ? other : answer.selected !== null && answer.selected !== undefined;
};

/** Why the item cannot move on, or '' when it can: a required item needs an answer, and an Other that is chosen
 *  needs its text (an empty Other on an optional item is no answer, not an error). */
export const problem = (item: QuestionItem, answer: Answer = emptyAnswer(item)): string => {
  if (isAnswered(item, answer)) return '';
  if (!item.required) return '';
  if (item.type === 'text') return 'Enter an answer to continue.';
  if (answer.otherOn && !chosen(answer).length) return 'Type your answer to continue.';
  return item.type === 'multiple' ? 'Choose at least one answer to continue.' : 'Choose an answer to continue.';
};

/** The first item that blocks a submit, or -1. */
export const firstProblem = (items: QuestionItem[], answers: Answers): number =>
  items.findIndex((item) => problem(item, answers[item.name]) !== '');

/** Picks a choice: single selects it (and leaves Other), multiple toggles it. */
export const pick = (item: QuestionItem, answer: Answer, value: ChoiceValue): Answer => {
  if (item.type === 'single') return { ...answer, selected: value, otherOn: false };
  const selected = chosen(answer);
  return {
    ...answer,
    selected: selected.some((v) => sameValue(v, value))
      ? selected.filter((v) => !sameValue(v, value))
      : [...selected, value],
  };
};

/** Picks Other: single moves the answer to it, multiple toggles it beside the choices. */
export const pickOther = (item: QuestionItem, answer: Answer): Answer =>
  item.type === 'single' ? { ...answer, selected: null, otherOn: true } : { ...answer, otherOn: !answer.otherOn };

export const isPicked = (item: QuestionItem, answer: Answer, value: ChoiceValue): boolean =>
  item.type === 'multiple'
    ? chosen(answer).some((v) => sameValue(v, value))
    : !answer.otherOn && answer.selected !== null && sameValue(answer.selected, value);

/** How many of a question's choices to draw when `shown` are asked for (CHOICES_PER_STEP, and one more step per Show
 *  more): whole steps, reaching the last picked choice (a default answer past the first step is drawn, not hidden). */
export const choicesToDraw = (item: QuestionItem, answer: Answer | null, shown: number): number => {
  const last = answer ? item.choices.reduce((at, c, i) => (isPicked(item, answer, c.value) ? i : at), -1) : -1;
  const base = Math.max(CHOICES_PER_STEP, Math.ceil((last + 1) / CHOICES_PER_STEP) * CHOICES_PER_STEP);
  return Math.min(item.choices.length, base + Math.max(0, shown - CHOICES_PER_STEP));
};

/** The shortcut shown on the answer at `index`: A..Z (letters) or 1..9 (numbers); none past those or when off. */
export const shortcutKey = (index: number, mode: string): string | null => {
  if (mode === 'numbers') return index < 9 ? String(index + 1) : null;
  if (mode === 'none') return null;
  return index < 26 ? String.fromCharCode(65 + index) : null;
};

/** The answer a pressed key picks, or -1. */
export const keyIndex = (key: unknown, mode: string, count: number): number => {
  if (typeof key !== 'string' || key.length !== 1) return -1;
  for (let i = 0; i < count; i += 1) if (shortcutKey(i, mode) === key.toUpperCase()) return i;
  return -1;
};

/** goTo's argument as an item index: a position (a number, or a numeric string) or an item's name; null for anything
 *  else. A position past either end goes to the nearest item. */
export const resolveIndex = (arg: unknown, items: QuestionItem[]): number | null => {
  if (!items.length) return null;
  if (typeof arg === 'string' && arg.trim() && !Number.isFinite(Number(arg))) {
    const i = items.findIndex((item) => item.name === arg.trim());
    return i === -1 ? null : i;
  }
  const n = typeof arg === 'number' ? arg : typeof arg === 'string' && arg.trim() ? Number(arg) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(items.length - 1, Math.trunc(n)));
};
