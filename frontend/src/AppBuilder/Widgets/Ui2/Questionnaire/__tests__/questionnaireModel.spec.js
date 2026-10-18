import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  CHOICES_PER_STEP,
  choicesToDraw,
  answerFrom,
  answerValue,
  answersOf,
  emptyAnswer,
  firstProblem,
  initialAnswers,
  isAnswered,
  isPicked,
  keyIndex,
  normalizeItems,
  pick,
  pickOther,
  problem,
  resolveIndex,
  shortcutKey,
} from '@/AppBuilder/Widgets/Ui2/Questionnaire/questionnaireModel';

const ITEMS = normalizeItems([
  { name: 'role', prompt: 'Role?', required: true, type: 'single', choices: ['Ops', 'Finance'], other: true },
  {
    name: 'goals',
    prompt: 'Goals?',
    type: 'multiple',
    choices: [{ label: 'Track', value: 'track', description: 'Orders' }, { label: 'Approve' }],
    other: { label: 'Something else', placeholder: 'Say more' },
  },
  { name: 'notes', prompt: 'Notes?', type: 'text', required: 'true', placeholder: 'Optional' },
]);
const [role, goals, notes] = ITEMS;

describe('normalizeItems', () => {
  it('reads the item shape', () => {
    expect(role).toMatchObject({ name: 'role', required: true, type: 'single', other: { label: 'Other' } });
    expect(role.choices).toEqual([
      { label: 'Ops', value: 'Ops', description: '' },
      { label: 'Finance', value: 'Finance', description: '' },
    ]);
    expect(goals.choices[0]).toEqual({ label: 'Track', value: 'track', description: 'Orders' });
    expect(goals.other).toEqual({ label: 'Something else', placeholder: 'Say more' });
    expect(notes).toMatchObject({ type: 'text', required: true, choices: [], other: null });
  });

  it('names unnamed items, keeps names unique and infers the type', () => {
    const items = normalizeItems([{ prompt: 'A' }, { name: 'x', choices: ['1'] }, { name: 'x' }, null, 'junk']);
    expect(items.map((i) => i.name)).toEqual(['question1', 'x', 'x_2']);
    expect(items.map((i) => i.type)).toEqual(['text', 'single', 'text']);
  });

  it('turns a choice question with no choices into text, and drops junk choices', () => {
    expect(normalizeItems([{ type: 'single', choices: [] }])[0].type).toBe('text');
    expect(
      normalizeItems([{ type: 'single', choices: [null, {}, { value: { a: 1 } }, 'A', 'A', ' '] }])[0].choices
    ).toHaveLength(1);
  });

  it('keeps every item and choice (the view draws one question, and choices in steps)', () => {
    expect(normalizeItems(Array.from({ length: 500 }, () => ({})))).toHaveLength(500);
    const many = normalizeItems([{ choices: Array.from({ length: 500 }, (_, i) => `c${i}`) }]);
    expect(many[0].choices).toHaveLength(500);
    expect(choicesToDraw(many[0], emptyAnswer(many[0]), CHOICES_PER_STEP)).toBe(CHOICES_PER_STEP);
    expect(choicesToDraw(many[0], { ...emptyAnswer(many[0]), selected: 'c199' }, CHOICES_PER_STEP)).toBe(200);
    expect(choicesToDraw(many[0], { ...emptyAnswer(many[0]), selected: 'c199' }, CHOICES_PER_STEP * 2)).toBe(250);
    expect(choicesToDraw(many[0], null, 1000)).toBe(500);
  });

  it('reads non-arrays as no items', () => {
    expect(normalizeItems('x')).toEqual([]);
    expect(normalizeItems(undefined)).toEqual([]);
  });
});

describe('answers', () => {
  it('picks one choice in a single question and toggles in a multiple one', () => {
    let a = pick(role, emptyAnswer(role), 'Ops');
    a = pick(role, a, 'Finance');
    expect(answerValue(role, a)).toBe('Finance');
    let m = pick(goals, emptyAnswer(goals), 'track');
    m = pick(goals, m, 'Approve');
    m = pick(goals, m, 'track');
    expect(answerValue(goals, m)).toEqual(['Approve']);
  });

  it('exposes Other as its text', () => {
    let a = pickOther(role, pick(role, emptyAnswer(role), 'Ops'));
    expect(isPicked(role, a, 'Ops')).toBe(false);
    a = { ...a, other: ' Legal ' };
    expect(answerValue(role, a)).toBe('Legal');
    const m = { ...pickOther(goals, pick(goals, emptyAnswer(goals), 'track')), other: 'Audit' };
    expect(answerValue(goals, m)).toEqual(['track', 'Audit']);
  });

  it('restores saved answers, a value that is no choice filling Other', () => {
    const answers = initialAnswers(ITEMS, { role: 'Legal', goals: ['track', 'Audit'], notes: 'Hi' });
    expect(answersOf(ITEMS, answers)).toEqual({ role: 'Legal', goals: ['track', 'Audit'], notes: 'Hi' });
    expect(answerFrom(role, 'Finance')).toMatchObject({ selected: 'Finance', otherOn: false });
    expect(answersOf(ITEMS, initialAnswers(ITEMS, 'junk'))).toEqual({ role: null, goals: [], notes: '' });
  });
});

describe('validation', () => {
  it('blocks a required question until answered', () => {
    expect(problem(role, emptyAnswer(role))).toBe('Choose an answer to continue.');
    expect(problem(notes, emptyAnswer(notes))).toBe('Enter an answer to continue.');
    expect(problem(role, pickOther(role, emptyAnswer(role)))).toBe('Type your answer to continue.');
    expect(problem(role, pick(role, emptyAnswer(role), 'Ops'))).toBe('');
    expect(problem(goals, emptyAnswer(goals))).toBe('');
    expect(isAnswered(notes, { ...emptyAnswer(notes), text: '   ' })).toBe(false);
  });

  it('finds the first question that blocks a submit', () => {
    const answers = initialAnswers(ITEMS, { role: 'Ops' });
    expect(firstProblem(ITEMS, answers)).toBe(2);
    expect(firstProblem(ITEMS, initialAnswers(ITEMS, { role: 'Ops', notes: 'x' }))).toBe(-1);
  });
});

describe('shortcuts and goTo', () => {
  it('labels answers with letters or numbers', () => {
    expect([0, 1, 25, 26].map((i) => shortcutKey(i, 'letters'))).toEqual(['A', 'B', 'Z', null]);
    expect([0, 8, 9].map((i) => shortcutKey(i, 'numbers'))).toEqual(['1', '9', null]);
    expect(shortcutKey(0, 'none')).toBeNull();
    expect(keyIndex('b', 'letters', 3)).toBe(1);
    expect(keyIndex('d', 'letters', 3)).toBe(-1);
    expect(keyIndex('2', 'numbers', 3)).toBe(1);
    expect(keyIndex('Enter', 'letters', 3)).toBe(-1);
  });

  it('resolves a position or a name', () => {
    expect(resolveIndex(1, ITEMS)).toBe(1);
    expect(resolveIndex('2', ITEMS)).toBe(2);
    expect(resolveIndex(99, ITEMS)).toBe(2);
    expect(resolveIndex(-4, ITEMS)).toBe(0);
    expect(resolveIndex('notes', ITEMS)).toBe(2);
    expect(resolveIndex('nope', ITEMS)).toBeNull();
    expect(resolveIndex({}, ITEMS)).toBeNull();
    expect(resolveIndex(0, [])).toBeNull();
  });
});
