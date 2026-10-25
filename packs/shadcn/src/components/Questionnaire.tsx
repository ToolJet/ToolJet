import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AlertCircle, Check, CircleCheck } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  CHOICES_PER_STEP,
  answersOf,
  choicesToDraw,
  emptyAnswer,
  firstProblem,
  initialAnswers,
  isPicked,
  keyIndex,
  normalizeItems,
  pick,
  pickOther,
  problem,
  resolveIndex,
  shortcutKey,
  type Answer,
  type ChoiceValue,
  type QuestionItem,
} from '../lib/ui2/display/chat/questionnaireModel';
import { fontStack, lookVars, px } from '../lib/ui2/display/chat/values';
import { LoadingBox, LoadingFrame, useLoading } from '../lib/ui2/loading/look';
import { activeElementIn } from '../lib/activeElement';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-chat.css';

// UI 2.0's Questionnaire (Ui2/Questionnaire): a data-driven multi-step form, one question at a time with progress,
// answer cards with shortcuts, Previous / Skip / Next / Submit and required-answer validation. Items are
// { name, prompt, description, required, type: single | multiple | text, choices, other, placeholder, multiline }; the
// pack's earlier { id, question, options } items still read (questionnaireModel.ts).

type AnswerOption = { kind: 'choice'; label: string; value: ChoiceValue; description: string } | { kind: 'other'; label: string; value: null; description: string };
type Event = { name: string };

const currentOf = (item: QuestionItem | undefined) =>
  item ? { name: item.name, prompt: item.prompt, type: item.type, required: item.required } : {};

let instanceCount = 0;

// A fixed-height widget scrolls its question: the root grows with its content (ui2q-root: min-height 100%) inside the
// host's clipped box, so a long question hid Next and Show more with no way to reach them (SP-30). Capped at the box
// (max-height 100% of a fixed height) it scrolls instead; with the height fitted to the content the cap resolves to
// none and the widget still grows.
const FIXED_BOX_SCROLL: React.CSSProperties = { maxHeight: '100%', overflowY: 'auto' };

export const Questionnaire = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: 'Array of { name, prompt, description, required, type: single | multiple | text, choices, other, placeholder }.',
    initialValue: [
      {
        name: 'role',
        prompt: 'What best describes your role?',
        required: true,
        type: 'single',
        choices: [{ label: 'Operations', description: 'Run day-to-day work' }, { label: 'Finance' }, { label: 'Engineering' }],
        other: true,
      },
      {
        name: 'goals',
        prompt: 'What do you want to get done first?',
        description: 'Pick all that apply.',
        type: 'multiple',
        choices: ['Track orders', 'Approve requests', 'Report on spend'],
      },
      { name: 'notes', prompt: 'Anything else we should know?', type: 'text', placeholder: 'Optional' },
    ],
  });
  const [defaultAnswers] = ToolJet.useStateObject({ name: 'defaultAnswers', label: 'Default answers', initialValue: {} });
  const [shortcuts] = ToolJet.useStateEnumeration({
    name: 'shortcuts',
    label: 'Answer shortcuts',
    enumDefinition: ['letters', 'numbers', 'none'],
    enumLabels: { letters: 'Letters', numbers: 'Numbers', none: 'None' },
    initialValue: 'letters',
    inspector: 'switch',
  });
  const [showProgress] = ToolJet.useStateBoolean({ name: 'showProgress', label: 'Show progress', initialValue: true });
  const [submitLabel] = ToolJet.useStateString({ name: 'submitLabel', label: 'Submit button label', initialValue: 'Submit' });
  const [completeTitle] = ToolJet.useStateString({ name: 'completeTitle', label: 'Completed title', initialValue: 'Thanks for your answers' });
  const [completeText] = ToolJet.useStateString({ name: 'completeText', label: 'Completed text', initialValue: 'We will use them to set up your workspace.' });
  const [surface] = ToolJet.useStateEnumeration({
    name: 'surface',
    label: 'Surface',
    enumDefinition: ['card', 'plain'],
    enumLabels: { card: 'Card', plain: 'Plain' },
    initialValue: 'card',
    inspector: 'switch',
  });
  // Exposed values.
  const [, setExposedAnswers] = ToolJet.useStateObject({ name: 'answers', initialValue: {}, inspector: 'hidden' });
  const [, setCurrentIndex] = ToolJet.useStateNumber({ name: 'currentIndex', initialValue: 0, inspector: 'hidden' });
  const [, setCurrentItem] = ToolJet.useStateObject({ name: 'currentItem', initialValue: {}, inspector: 'hidden' });
  const [, setIsComplete] = ToolJet.useStateBoolean({ name: 'isComplete', initialValue: false, inspector: 'hidden' });
  const onStepChanged = ToolJet.useEventCallback({ name: 'onStepChanged', displayName: 'On step changed' } as Event);
  const onSubmit = ToolJet.useEventCallback({ name: 'onSubmit', displayName: 'On submit' } as Event);

  const accentColor = useThemeColor('accentColor', 'Accent (progress, selected answer, buttons)', TOKEN.brand);
  const backgroundColor = useThemeColor('backgroundColor', 'Background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Border and answer card border', TOKEN.border);
  const titleColor = useThemeColor('titleColor', 'Question color', TOKEN.text);
  const textColor = useThemeColor('textColor', 'Description and answer description color', TOKEN.mutedText);
  const borderRadius = useThemeRadius('borderRadius', 'Radius');
  const titleFontFamily = ToolJet.useStyleEnumeration({
    name: 'titleFontFamily',
    label: 'Question typeface',
    enumDefinition: ['theme', 'sans', 'serif', 'display', 'mono'],
    enumLabels: { theme: 'Theme font', sans: 'Sans serif', serif: 'Serif', display: 'Display serif', mono: 'Monospace' },
    initialValue: 'theme',
  });
  const loadingNow = useLoading();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 48 });

  const [domId] = useState(() => `ui2q-${++instanceCount}`);
  const itemsKey = useMemo(() => safeKey(rawItems), [rawItems]);
  const defaultsKey = useMemo(() => safeKey(defaultAnswers), [defaultAnswers]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => normalizeItems(rawItems), [itemsKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaults = useMemo(() => initialAnswers(items, defaultAnswers), [items, defaultsKey]);

  const [answers, setAnswers] = useState(defaults);
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [shownChoices, setShownChoices] = useState(CHOICES_PER_STEP);
  const focusTo = useRef<number | null>(null);

  // New items or default answers start the questionnaire again (an inspector edit, a query that loaded them).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setAnswers(defaults);
    setIndex(0);
    setComplete(false);
    setError('');
    focusTo.current = null;
  }, [defaults]);

  const count = items.length;
  const at = count ? Math.min(index, count - 1) : 0;
  const item = items[at];
  const answer = item ? answers[item.name] || emptyAnswer(item) : null;
  useEffect(() => setShownChoices(CHOICES_PER_STEP), [item?.name]);
  const drawnChoices = item && answer ? choicesToDraw(item, answer, shownChoices) : 0;
  const exposedAnswers = useMemo(() => answersOf(items, answers), [items, answers]);

  // The exposed values follow the state.
  useEffect(() => setExposedAnswers(exposedAnswers as Record<string, unknown>), [exposedAnswers]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCurrentIndex(at);
    setCurrentItem(currentOf(item));
  }, [at, item]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setIsComplete(complete), [complete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moves to a question; onStepChanged fires once the exposed values show the new position.
  const move = (to: number, reopened = false) => {
    if (!count) return;
    const target = Math.max(0, Math.min(count - 1, to));
    const moved = target !== at || reopened;
    setIndex(target);
    setError('');
    setCurrentIndex(target);
    setCurrentItem(currentOf(items[target]));
    if (moved) onStepChanged();
  };

  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => {
    setAnswers(defaults);
    setIndex(0);
    setComplete(false);
    setError('');
    setExposedAnswers(answersOf(items, defaults) as Record<string, unknown>);
    setCurrentIndex(0);
    setCurrentItem(currentOf(items[0]));
    setIsComplete(false);
  });
  const goTo = (arg: unknown) => {
    const target = resolveIndex(arg, items);
    if (target === null) return;
    setComplete(false);
    setIsComplete(false);
    move(target, true);
  };
  ToolJet.useAction(
    { name: 'goTo', displayName: 'Go to question', params: [{ handle: 'index', displayName: 'Index or name', defaultValue: '{{0}}' }] },
    (arg) => goTo(arg)
  );

  const update = (next: Answer) => {
    if (!item) return;
    setAnswers((a) => ({ ...a, [item.name]: next }));
    if (error) setError('');
  };

  const groupRef = useRef<HTMLFieldSetElement>(null);
  const focusFirst = () => {
    const el = groupRef.current?.querySelector<HTMLElement>('[data-answer], textarea, input');
    if (el && typeof el.focus === 'function') el.focus();
  };
  // A step taken from the buttons puts focus in the new question once it is drawn; goTo, an action, leaves focus.
  useEffect(() => {
    const wanted = focusTo.current;
    focusTo.current = null;
    if (wanted === at) focusFirst();
  }, [at]);
  const step = (to: number) => {
    const target = Math.max(0, Math.min(count - 1, to));
    focusTo.current = target === at ? null : target;
    move(to);
  };
  const next = () => {
    if (!item || !answer) return;
    const why = problem(item, answer);
    if (why) {
      setError(why);
      focusFirst();
      return;
    }
    step(at + 1);
  };
  // Skip leaves the question unanswered and moves on.
  const skip = () => {
    if (!item) return;
    setAnswers((a) => ({ ...a, [item.name]: emptyAnswer(item) }));
    step(at + 1);
  };
  const submit = () => {
    const missing = firstProblem(items, answers);
    if (missing !== -1) {
      if (missing !== at) step(missing);
      else focusFirst();
      setError(problem(items[missing], answers[items[missing].name]));
      return;
    }
    setComplete(true);
    setIsComplete(true);
    onSubmit();
  };

  const last = at === count - 1;
  const mode = ['letters', 'numbers', 'none'].includes(shortcuts) ? shortcuts : 'letters';
  const options: AnswerOption[] = item
    ? [
        ...item.choices.slice(0, drawnChoices).map((c) => ({ kind: 'choice' as const, ...c })),
        ...(item.other ? [{ kind: 'other' as const, label: item.other.label, value: null, description: '' }] : []),
      ]
    : [];
  const choose = (option: AnswerOption) => {
    if (!item || !answer) return;
    update(option.kind === 'other' ? pickOther(item, answer) : pick(item, answer, option.value));
  };

  // Shortcut keys pick an answer, arrows move between answers and Enter goes on, while focus is in the question (not
  // while typing in a text answer).
  const onKeyDown = (e: KeyboardEvent<HTMLFieldSetElement>) => {
    if (!item || e.nativeEvent.isComposing) return;
    const target = e.target as HTMLElement | null;
    const typing = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT';
    if (e.key === 'Enter' && !e.shiftKey && (!typing || target?.tagName === 'INPUT')) {
      if (target?.getAttribute?.('data-answer') === '') return;
      e.preventDefault();
      if (last) submit();
      else next();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = keyIndex(e.key, mode, options.length);
    if (i !== -1) {
      e.preventDefault();
      choose(options[i]);
      groupRef.current?.querySelectorAll<HTMLElement>('[data-answer]')[i]?.focus();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const cards = Array.from(groupRef.current?.querySelectorAll<HTMLElement>('[data-answer]') || []);
      if (!cards.length) return;
      // Focus as the question's own root sees it: in the inline runtime's shadow root document.activeElement is the
      // host, so every arrow started again from the first card (SP-22).
      const from = cards.indexOf(activeElementIn(groupRef.current) as HTMLElement);
      e.preventDefault();
      const to = e.key === 'ArrowDown' ? (from + 1) % cards.length : (from - 1 + cards.length) % cards.length;
      cards[from === -1 ? 0 : to]?.focus();
    }
  };

  const style = lookVars([
    [accentColor, '--lk-accent'],
    [backgroundColor, '--lk-bg'],
    [borderColor, '--lk-border'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [borderRadius, '--lk-radius', px],
    [titleFontFamily, '--lk-title-font', fontStack],
  ]);
  const errorId = `${domId}-error`;
  const promptId = `${domId}-prompt`;

  let body;
  if (!count || !item || !answer) {
    body = <p className="ui2q-none">No questions yet</p>;
  } else if (complete) {
    body = (
      <div className="ui2q-done" data-complete="">
        <span className="ui2q-done-icon">
          <CircleCheck />
        </span>
        <h3 className="ui2q-title">{String(completeTitle ?? '') || 'Thanks for your answers'}</h3>
        {completeText ? <p className="ui2q-done-text">{String(completeText)}</p> : null}
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--auto" onClick={() => goTo(count - 1)}>
          Edit answers
        </button>
      </div>
    );
  } else {
    const field = {
      'aria-labelledby': promptId,
      'aria-invalid': error ? true : undefined,
      value: answer.text,
      placeholder: item.placeholder || 'Type your answer',
      onChange: (e: { target: { value: string } }) => update({ ...answer, text: e.target.value }),
    };
    body = (
      <>
        {showProgress !== false ? (
          <div className="ui2q-progress">
            <div className="ui2q-progress-label">
              <span>{`Question ${at + 1} of ${count}`}</span>
              {!item.required ? <span>Optional</span> : null}
            </div>
            <div
              className="ui2q-progress-track"
              role="progressbar"
              aria-label="Questionnaire progress"
              aria-valuemin={1}
              aria-valuemax={count}
              aria-valuenow={at + 1}
              aria-valuetext={`Question ${at + 1} of ${count}`}
            >
              <div style={{ width: `${Math.round(((at + 1) / count) * 100)}%` }} />
            </div>
          </div>
        ) : null}
        <fieldset
          key={item.name}
          ref={groupRef}
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="ui2q-step"
        >
          <legend id={promptId} className="ui2q-legend">
            <span className="ui2q-title ui2q-prompt">
              {item.prompt}
              {item.required ? (
                <span className="ui2q-required" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
            {item.description ? <span className="ui2q-description">{item.description}</span> : null}
          </legend>
          {item.type === 'text' ? (
            item.multiline ? (
              <textarea {...field} className="ui-textarea ui2q-field ui2q-textarea" />
            ) : (
              <input {...field} className="ui-input ui2q-field" />
            )
          ) : (
            <div role={item.type === 'single' ? 'radiogroup' : 'group'} aria-labelledby={promptId} aria-required={item.required || undefined} className="ui2q-answers">
              {options.map((option, i) => {
                const checked = option.kind === 'other' ? !!answer.otherOn : isPicked(item, answer, option.value);
                const key = shortcutKey(i, mode);
                const role = item.type === 'single' ? 'radio' : 'checkbox';
                return (
                  <button
                    key={option.kind === 'other' ? '__other' : String(option.value)}
                    id={`${domId}-${item.name}-${i}`}
                    type="button"
                    role={role}
                    aria-checked={checked}
                    aria-invalid={error ? true : undefined}
                    data-answer=""
                    className={cn('ui2q-card', checked && 'is-checked')}
                    onClick={() => choose(option)}
                  >
                    {key ? (
                      <kbd className="ui2q-key" aria-hidden="true">
                        {key}
                      </kbd>
                    ) : null}
                    <span className="ui2q-card-text">
                      <span className="ui2q-card-label">{option.label}</span>
                      {option.description ? <span className="ui2q-card-desc">{option.description}</span> : null}
                    </span>
                    <span className={cn('ui2q-check', role === 'radio' && 'is-radio')} aria-hidden="true">
                      <Check strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
              {item.other && answer.otherOn ? (
                <input
                  autoFocus
                  aria-label={item.other.label}
                  value={answer.other}
                  placeholder={item.other.placeholder}
                  onChange={(e) => update({ ...answer, other: e.target.value })}
                  className="ui-input ui2q-field ui2q-other"
                />
              ) : null}
            </div>
          )}
          {error ? (
            <p id={errorId} role="alert" className="ui2q-error">
              <AlertCircle aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </fieldset>
        {item.type !== 'text' && item.choices.length > drawnChoices ? (
          <div className="ui2q-more">
            <button type="button" onClick={() => setShownChoices((n) => n + CHOICES_PER_STEP)}>
              {`Show ${Math.min(CHOICES_PER_STEP, item.choices.length - drawnChoices)} more of ${item.choices.length - drawnChoices}`}
            </button>
          </div>
        ) : null}
        <div className="ui2q-nav">
          {at > 0 ? (
            <button type="button" className="ui-btn ui-btn--outline ui-btn--auto" onClick={() => step(at - 1)}>
              Previous
            </button>
          ) : null}
          <div className="ui2q-nav-end">
            {!item.required && !last ? (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--auto" onClick={skip}>
                Skip
              </button>
            ) : null}
            <button type="button" className="ui-btn ui-btn--default ui-btn--auto ui2q-primary" onClick={last ? submit : next}>
              {last ? String(submitLabel ?? '') || 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <LoadingFrame loading={loadingNow} look={<LoadingBox />}>
      <div className="ui ui2q-root" style={{ ...(style as React.CSSProperties), ...FIXED_BOX_SCROLL }}>
        <div id={domId} className={cn('ui2q', surface !== 'plain' ? 'ui2q--card' : 'ui2q--plain')} data-step={complete ? 'complete' : at}>
          {body}
        </div>
      </div>
    </LoadingFrame>
  );
};

function safeKey(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(Math.random());
  }
}
