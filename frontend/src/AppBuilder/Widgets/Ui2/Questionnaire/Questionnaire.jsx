import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
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
} from './questionnaireModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { QuestionAnswer } from './QuestionAnswer';

// ToolJet UI 2.0 Questionnaire: a data-driven multi-step form after shadcn's Questionnaire, one question at a time
// with progress, answer cards with shortcuts, Previous / Skip / Next / Submit and required-answer validation. Config in
// WidgetManager/widgets/shad*.js, logic in questionnaireModel.js, the answer and its cards in QuestionAnswer.jsx,
// style variables in looks/conversation.js.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';

export const ShadQuestionnaire = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);

  const itemsKey = stringify(p.items ?? null);
  const defaultsKey = stringify(p.defaultAnswers ?? null);
  const items = useMemo(() => normalizeItems(p.items), [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const defaults = useMemo(() => initialAnswers(items, p.defaultAnswers), [items, defaultsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const currentItem = item ? { name: item.name, prompt: item.prompt, type: item.type, required: item.required } : {};

  const state = (next = {}) => ({
    answers: next.answers ?? exposedAnswers,
    currentIndex: next.currentIndex ?? at,
    currentItem: next.currentItem ?? currentItem,
    isComplete: next.isComplete ?? complete,
  });

  // Moves to a question; onStepChange fires once the exposed state shows the new position.
  const move = (to, extra = {}) => {
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

  const latest = useRef({});
  latest.current = { move, items, defaults, count };
  const actions = useMemo(
    () => ({
      reset: async () => {
        const { defaults: d, items: its } = latest.current;
        setAnswers(d);
        setIndex(0);
        setComplete(false);
        setError('');
        setExposedVariables({
          answers: answersOf(its, d),
          currentIndex: 0,
          currentItem: its[0]
            ? { name: its[0].name, prompt: its[0].prompt, type: its[0].type, required: its[0].required }
            : {},
          isComplete: false,
        });
      },
      goTo: async (arg) => {
        const target = resolveIndex(arg, latest.current.items);
        if (target === null) return;
        setComplete(false);
        latest.current.move(target, { isComplete: false });
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useExposed(setExposedVariables, p, { ...state(), ...actions });

  const update = (next) => {
    setAnswers((a) => ({ ...a, [item.name]: next }));
    if (error) setError('');
  };

  const groupRef = useRef(null);
  const focusFirst = () => {
    const el = groupRef.current?.querySelector('[data-answer], textarea, input');
    if (el && typeof el.focus === 'function') el.focus();
  };

  const next = () => {
    const why = problem(item, answer);
    if (why) {
      setError(why);
      focusFirst();
      return;
    }
    move(at + 1);
  };
  // Skip leaves the question unanswered and moves on.
  const skip = () => {
    const cleared = { ...answers, [item.name]: emptyAnswer(item) };
    setAnswers(cleared);
    move(at + 1, { answers: answersOf(items, cleared) });
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
  const options = item
    ? [
        ...item.choices.map((c) => ({ kind: 'choice', ...c })),
        ...(item.other ? [{ kind: 'other', label: item.other.label, value: null, description: '' }] : []),
      ]
    : [];

  const choose = (option) => {
    if (disabled) return;
    update(option.kind === 'other' ? pickOther(item, answer) : pick(item, answer, option.value));
  };

  // Shortcut keys pick an answer, arrows move between answers and Enter goes on, while focus is in the question (not
  // while typing in a text answer).
  const onKeyDown = (e) => {
    if (disabled || !item) return;
    const typing = e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT';
    if (e.key === 'Enter' && !e.shiftKey && (!typing || e.target?.tagName === 'INPUT')) {
      if (e.target?.getAttribute?.('data-answer') === '') return; // the button's own Enter picks it
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
      groupRef.current?.querySelectorAll('[data-answer]')[i]?.focus();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const cards = Array.from(groupRef.current?.querySelectorAll('[data-answer]') || []);
      const from = cards.indexOf(document.activeElement);
      if (!cards.length) return;
      e.preventDefault();
      const to = e.key === 'ArrowDown' ? (from + 1) % cards.length : (from - 1 + cards.length) % cards.length;
      cards[from === -1 ? 0 : to]?.focus();
    }
  };

  const card = p.surface !== 'plain';
  const frame = cn('flex flex-col', card ? 'border border-[color:var(--lk-border,var(--sc-border))] p-6' : 'p-1');
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
    body = <p className="m-0 py-8 text-center text-sm text-muted-foreground">No questions yet</p>;
  } else if (complete) {
    body = (
      <div className="flex flex-col items-center gap-3 py-8 text-center" data-complete="">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full [&_svg]:size-6"
          style={{ background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`, color: ACCENT }}
        >
          <CircleCheck />
        </span>
        <h3 className="m-0 text-lg font-semibold text-[color:var(--lk-title,var(--sc-foreground))]" style={titleStyle}>
          {String(p.completeTitle ?? '') || 'Thanks for your answers'}
        </h3>
        {p.completeText ? (
          <p className="m-0 max-w-sm text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
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
          <div className="mb-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              <span className="tabular-nums">{`Question ${at + 1} of ${count}`}</span>
              {!item.required ? <span>Optional</span> : null}
            </div>
            <div
              role="progressbar"
              aria-label="Questionnaire progress"
              aria-valuemin={1}
              aria-valuemax={count}
              aria-valuenow={at + 1}
              aria-valuetext={`Question ${at + 1} of ${count}`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--sc-muted)]"
            >
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
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
          className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 duration-200 animate-in fade-in slide-in-from-right-2"
        >
          <legend id={promptId} className="float-left m-0 w-full p-0">
            <span
              className="block text-lg font-semibold leading-snug text-[color:var(--lk-title,var(--sc-foreground))]"
              style={titleStyle}
            >
              {item.prompt}
              {item.required ? (
                <span className="ml-1 text-[color:var(--sc-destructive)]" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
            {item.description ? (
              <span className="mt-1 block text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
                {item.description}
              </span>
            ) : null}
          </legend>
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
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="m-0 flex items-center gap-1.5 text-sm text-[color:var(--sc-destructive)]"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </fieldset>
        <div className="mt-6 flex items-center gap-2">
          {at > 0 ? (
            <Button variant="outline" disabled={disabled} onClick={() => move(at - 1)}>
              Previous
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {!item.required && !last ? (
              <Button variant="ghost" disabled={disabled} onClick={skip}>
                Skip
              </Button>
            ) : null}
            {last ? (
              <Button
                disabled={disabled}
                onClick={submit}
                className="bg-[color:var(--lk-accent,var(--sc-primary))] hover:bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_90%,transparent)]"
              >
                {String(p.submitLabel ?? '') || 'Submit'}
              </Button>
            ) : (
              <Button
                disabled={disabled}
                onClick={next}
                className="bg-[color:var(--lk-accent,var(--sc-primary))] hover:bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_90%,transparent)]"
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
