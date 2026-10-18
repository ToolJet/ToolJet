import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  answersOf,
  emptyAnswer,
  firstProblem,
  initialAnswers,
  keyIndex,
  normalizeItems,
  pick,
  pickOther,
  problem,
  resolveIndex,
  type Answer,
  type AnswerValue,
  type QuestionType,
} from './questionnaireModel';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { QuestionAnswer, type AnswerOption } from './QuestionAnswer';
import type { KeyboardEvent } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isComposing, isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

/** What the Questionnaire exposes besides its actions. */
type QuestionnaireState = {
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  currentItem: { name: string; prompt: string; type: QuestionType; required: boolean } | Record<string, never>;
  isComplete: boolean;
};

// ToolJet UI 2.0 Questionnaire: a data-driven multi-step form after shadcn's Questionnaire, one question at a time
// with progress, answer cards with shortcuts, Previous / Skip / Next / Submit and required-answer validation. Config in
// WidgetManager/widgets/shad*.js, logic in questionnaireModel.ts, the answer and its cards in QuestionAnswer.tsx,
// style variables in looks/conversation.ts.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';

export const ShadQuestionnaire = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);

  const rawItems = useStable(p.items);
  const defaultAnswers = useStable(p.defaultAnswers);
  const items = useMemo(() => normalizeItems(rawItems), [rawItems]);
  const defaults = useMemo(() => initialAnswers(items, defaultAnswers), [items, defaultAnswers]);

  const [answers, setAnswers] = useState(defaults);
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
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
  }, [defaults]);

  const count = items.length;
  const at = count ? Math.min(index, count - 1) : 0;
  const item = items[at];
  const answer = item ? answers[item.name] || emptyAnswer(item) : null;
  const exposedAnswers = useMemo(() => answersOf(items, answers), [items, answers]);
  const currentItem: QuestionnaireState['currentItem'] = item
    ? { name: item.name, prompt: item.prompt, type: item.type, required: item.required }
    : {};

  const state = (next: Partial<QuestionnaireState> = {}): QuestionnaireState => ({
    answers: next.answers ?? exposedAnswers,
    currentIndex: next.currentIndex ?? at,
    currentItem: next.currentItem ?? currentItem,
    isComplete: next.isComplete ?? complete,
  });

  // Moves to a question; onStepChange fires once the exposed state shows the new position.
  const move = (to: number, extra: Partial<QuestionnaireState> = {}) => {
    if (!count) return;
    const target = Math.max(0, Math.min(count - 1, to));
    const moved = target !== at || extra.isComplete === false;
    setIndex(target);
    setError('');
    const it = items[target];
    setExposedVariables(
      state({
        currentIndex: target,
        currentItem: { name: it.name, prompt: it.prompt, type: it.type, required: it.required },
        ...extra,
      })
    );
    if (moved) fireEvent('onStepChanged');
  };

  const latest = useRef({ move, items, defaults, count, setExposedVariables });
  latest.current = { move, items, defaults, count, setExposedVariables };
  const actions = useMemo(
    () => ({
      reset: async () => {
        const { defaults: d, items: its } = latest.current;
        setAnswers(d);
        setIndex(0);
        setComplete(false);
        setError('');
        latest.current.setExposedVariables({
          answers: answersOf(its, d),
          currentIndex: 0,
          currentItem: its[0]
            ? { name: its[0].name, prompt: its[0].prompt, type: its[0].type, required: its[0].required }
            : {},
          isComplete: false,
        });
      },
      goTo: async (arg: unknown) => {
        const target = resolveIndex(arg, latest.current.items);
        if (target === null) return;
        setComplete(false);
        latest.current.move(target, { isComplete: false });
      },
    }),
    []
  );

  useExposed(setExposedVariables, p, { ...state(), ...actions });

  const update = (next: Answer) => {
    setAnswers((a) => ({ ...a, [item.name]: next }));
    if (error) setError('');
  };

  const groupRef = useRef<HTMLFieldSetElement>(null);
  const focusFirst = () => {
    const el = groupRef.current?.querySelector<HTMLElement>('[data-answer], textarea, input');
    if (el && typeof el.focus === 'function') el.focus();
  };

  // A step the user takes from the buttons puts focus in the new question once it is drawn (its fieldset is a new
  // one), so the keyboard is where the screen moved; goTo, an action, leaves focus where it is.
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    focusFirst();
  }, [at]);
  const step = (to: number, extra?: Partial<QuestionnaireState>) => {
    focusNext.current = true;
    move(to, extra);
  };
  const next = () => {
    if (!answer) return;
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
    const cleared = { ...answers, [item.name]: emptyAnswer(item) };
    setAnswers(cleared);
    step(at + 1, { answers: answersOf(items, cleared) });
  };
  const submit = () => {
    const missing = firstProblem(items, answers);
    if (missing !== -1) {
      if (missing !== at) move(missing);
      setError(problem(items[missing], answers[items[missing].name]));
      setTimeout(focusFirst, 0);
      return;
    }
    setComplete(true);
    setExposedVariables(state({ isComplete: true }));
    fireEvent('onSubmit');
  };

  const disabled = busy(p);
  const last = at === count - 1;
  const mode = ['letters', 'numbers', 'none'].includes(p.shortcuts) ? p.shortcuts : 'letters';
  const options: AnswerOption[] = item
    ? [
        ...item.choices.map((c) => ({ kind: 'choice' as const, ...c })),
        ...(item.other ? [{ kind: 'other' as const, label: item.other.label, value: null, description: '' }] : []),
      ]
    : [];

  const choose = (option: AnswerOption) => {
    if (disabled || !answer) return;
    update(option.kind === 'other' ? pickOther(item, answer) : pick(item, answer, option.value));
  };

  // Shortcut keys pick an answer, arrows move between answers and Enter goes on, while focus is in the question (not
  // while typing in a text answer).
  const onKeyDown = (e: KeyboardEvent<HTMLFieldSetElement>) => {
    // Keys of an IME composition (the Enter that confirms composed characters in Other) are the input method's.
    if (disabled || !item || isComposing(e)) return;
    const target = e.target as HTMLElement | null;
    const typing = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT';
    if (isEnter(e) && !e.shiftKey && (!typing || target?.tagName === 'INPUT')) {
      if (target?.getAttribute?.('data-answer') === '') return; // the button's own Enter picks it
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
      const from = cards.indexOf(document.activeElement as HTMLElement);
      if (!cards.length) return;
      e.preventDefault();
      const to = e.key === 'ArrowDown' ? (from + 1) % cards.length : (from - 1 + cards.length) % cards.length;
      cards[from === -1 ? 0 : to]?.focus();
    }
  };

  const card = p.surface !== 'plain';
  const frame = cn(
    'tw-flex tw-flex-col',
    card ? 'tw-border tw-border-[color:var(--lk-border,var(--sc-border))] tw-p-6' : 'tw-p-1'
  );
  const frameStyle = card
    ? {
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  const titleStyle = { fontFamily: 'var(--lk-title-font,inherit)' };
  const errorId = `${id}-q-error`;
  const promptId = `${id}-q-prompt`;

  let body;
  if (!count) {
    body = (
      <p className="tw-m-0 tw-py-8 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">No questions yet</p>
    );
  } else if (complete) {
    body = (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-py-8 tw-text-center" data-complete="">
        <span
          className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full [&_svg]:tw-size-6"
          style={{ background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`, color: ACCENT }}
        >
          <CircleCheck />
        </span>
        <h3
          className="tw-m-0 tw-text-ui2-lg tw-font-semibold tw-text-[color:var(--lk-title,var(--sc-foreground))]"
          style={titleStyle}
        >
          {String(p.completeTitle ?? '') || 'Thanks for your answers'}
        </h3>
        {p.completeText ? (
          <p className="tw-m-0 tw-max-w-sm tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
            {String(p.completeText)}
          </p>
        ) : null}
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => actions.goTo(count - 1)}>
          Edit answers
        </Button>
      </div>
    );
  } else {
    const percent = Math.round(((at + 1) / count) * 100);
    body = (
      <>
        {p.showProgress !== false ? (
          <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-2">
            <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              <span className="tw-tabular-nums">{`Question ${at + 1} of ${count}`}</span>
              {!item.required ? <span>Optional</span> : null}
            </div>
            <div
              role="progressbar"
              aria-label="Questionnaire progress"
              aria-valuemin={1}
              aria-valuemax={count}
              aria-valuenow={at + 1}
              aria-valuetext={`Question ${at + 1} of ${count}`}
              className="tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-[color:var(--sc-muted)]"
            >
              <div
                className="tw-h-full tw-rounded-full tw-transition-[width] tw-duration-300 tw-ease-out"
                style={{ width: `${percent}%`, background: ACCENT }}
              />
            </div>
          </div>
        ) : null}
        <fieldset
          key={item.name}
          ref={groupRef}
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-4 tw-border-0 tw-p-0 tw-duration-200 tw-animate-in tw-fade-in tw-slide-in-from-right-2"
        >
          <legend id={promptId} className="tw-float-left tw-m-0 tw-w-full tw-p-0">
            <span
              className="tw-block tw-text-ui2-lg tw-font-semibold tw-leading-snug tw-text-[color:var(--lk-title,var(--sc-foreground))]"
              style={titleStyle}
            >
              {item.prompt}
              {item.required ? (
                <span className="tw-ml-1 tw-text-[color:var(--sc-destructive)]" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
            {item.description ? (
              <span className="tw-mt-1 tw-block tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
                {item.description}
              </span>
            ) : null}
          </legend>
          {answer ? (
            <QuestionAnswer
              id={id}
              item={item}
              answer={answer}
              error={error}
              disabled={disabled}
              promptId={promptId}
              options={options}
              mode={mode}
              update={update}
              choose={choose}
            />
          ) : null}
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-text-ui2-sm tw-text-[color:var(--sc-destructive)]"
            >
              <AlertCircle className="tw-h-4 tw-w-4 tw-shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </fieldset>
        <div className="tw-mt-6 tw-flex tw-items-center tw-gap-2">
          {at > 0 ? (
            <Button variant="outline" disabled={disabled} onClick={() => step(at - 1)}>
              Previous
            </Button>
          ) : null}
          <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
            {!item.required && !last ? (
              <Button variant="ghost" disabled={disabled} onClick={skip}>
                Skip
              </Button>
            ) : null}
            {last ? (
              <Button
                disabled={disabled}
                onClick={submit}
                className="tw-bg-[color:var(--lk-accent,var(--sc-primary))] hover:tw-bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_90%,transparent)]"
              >
                {String(p.submitLabel ?? '') || 'Submit'}
              </Button>
            ) : (
              <Button
                disabled={disabled}
                onClick={next}
                className="tw-bg-[color:var(--lk-accent,var(--sc-primary))] hover:tw-bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_90%,transparent)]"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <Shell {...props} innerRef={ref}>
      <div id={id} className={frame} style={frameStyle} data-step={complete ? 'complete' : at}>
        {body}
      </div>
    </Shell>
  );
};

export default withControlState(ShadQuestionnaire);
