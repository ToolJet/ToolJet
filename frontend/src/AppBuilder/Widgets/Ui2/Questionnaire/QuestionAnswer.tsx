import React from 'react';
import { Check } from 'lucide-react';
import { Input, Textarea, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isPicked, shortcutKey, type Answer, type Choice, type QuestionItem } from './questionnaireModel';
import type { KeyboardEventHandler } from 'react';

/** An answer card's option: one of the question's choices, or its Other. */
export type AnswerOption =
  | ({ kind: 'choice' } & Choice)
  | { kind: 'other'; label: string; value: null; description: string };

// ToolJet UI 2.0 Questionnaire (Questionnaire.tsx): a question's answer, a text field or answer cards with shortcuts.

interface AnswerCardProps {
  id: string;
  role: 'radio' | 'checkbox';
  checked: boolean;
  shortcut: string | null;
  label: string;
  description: string;
  onSelect: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  disabled: boolean;
  invalid: boolean;
}

const AnswerCard = ({
  id,
  role,
  checked,
  shortcut,
  label,
  description,
  onSelect,
  onKeyDown,
  disabled,
  invalid,
}: AnswerCardProps) => (
  <button
    id={id}
    type="button"
    role={role}
    aria-checked={checked}
    aria-invalid={invalid || undefined}
    data-answer=""
    disabled={disabled}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    className={cn(
      'group/answer flex w-full items-center gap-3 rounded-[var(--lk-radius,var(--sc-radius))] border px-3.5 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-ring))_50%,transparent)] disabled:cursor-not-allowed disabled:opacity-60',
      checked
        ? 'border-[color:var(--lk-accent,var(--sc-primary))] bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_7%,transparent)]'
        : 'border-[color:var(--lk-border,var(--sc-border))] bg-transparent hover:bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
    )}
  >
    {shortcut ? (
      <kbd
        className={cn(
          'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border px-1.5 font-sans text-xs font-medium transition-colors',
          checked
            ? 'border-transparent bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--sc-primary-foreground)]'
            : 'border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--sc-background)] text-[color:var(--lk-fg,var(--sc-muted-foreground))]'
        )}
        aria-hidden="true"
      >
        {shortcut}
      </kbd>
    ) : null}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-sm font-medium leading-snug text-[color:var(--lk-title,var(--sc-foreground))]">
        {label}
      </span>
      {description ? (
        <span className="text-xs leading-snug text-[color:var(--lk-fg,var(--sc-muted-foreground))]">{description}</span>
      ) : null}
    </span>
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors [&_svg]:size-3.5',
        role === 'radio' ? 'rounded-full' : 'rounded-[5px]',
        checked
          ? 'border-transparent bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--sc-primary-foreground)]'
          : 'border-[color:var(--lk-border,var(--sc-input))] bg-transparent text-transparent'
      )}
      aria-hidden="true"
    >
      <Check strokeWidth={3} />
    </span>
  </button>
);

/** The current question's answer: a text field (one line or several), else its choices as answer cards, with a field
 *  for the 'other' answer when it is picked. */
interface QuestionAnswerProps {
  id: string;
  item: QuestionItem;
  answer: Answer;
  error: string;
  disabled: boolean;
  promptId: string;
  options: AnswerOption[];
  mode: string;
  update: (next: Answer) => void;
  choose: (option: AnswerOption) => void;
}

export const QuestionAnswer = ({
  id,
  item,
  answer,
  error,
  disabled,
  promptId,
  options,
  mode,
  update,
  choose,
}: QuestionAnswerProps) =>
  item.type === 'text' && !item.multiline ? (
    <Input
      aria-labelledby={promptId}
      aria-invalid={error ? true : undefined}
      value={answer.text}
      placeholder={item.placeholder || 'Type your answer'}
      disabled={disabled}
      onChange={(e) => update({ ...answer, text: e.target.value })}
      className="rounded-[var(--lk-radius,var(--sc-radius))] border-[color:var(--lk-border,var(--sc-input))]"
    />
  ) : item.type === 'text' ? (
    <Textarea
      aria-labelledby={promptId}
      aria-invalid={error ? true : undefined}
      value={answer.text}
      placeholder={item.placeholder || 'Type your answer'}
      disabled={disabled}
      onChange={(e) => update({ ...answer, text: e.target.value })}
      className="min-h-[96px] rounded-[var(--lk-radius,var(--sc-radius))] border-[color:var(--lk-border,var(--sc-input))]"
    />
  ) : (
    <div
      role={item.type === 'single' ? 'radiogroup' : 'group'}
      aria-labelledby={promptId}
      aria-required={item.required || undefined}
      className="flex flex-col gap-2"
    >
      {options.map((option, i) => {
        const checked = option.kind === 'other' ? !!answer.otherOn : isPicked(item, answer, option.value);
        return (
          <AnswerCard
            key={option.kind === 'other' ? '__other' : String(option.value)}
            id={`${id}-q-${item.name}-${i}`}
            role={item.type === 'single' ? 'radio' : 'checkbox'}
            checked={checked}
            shortcut={shortcutKey(i, mode)}
            label={option.label}
            description={option.description}
            disabled={disabled}
            invalid={!!error}
            onSelect={() => choose(option)}
          />
        );
      })}
      {item.other && answer.otherOn ? (
        <Input
          autoFocus
          aria-label={item.other.label}
          value={answer.other}
          placeholder={item.other.placeholder}
          disabled={disabled}
          onChange={(e) => update({ ...answer, other: e.target.value })}
          className="mt-1 rounded-[var(--lk-radius,var(--sc-radius))] border-[color:var(--lk-border,var(--sc-input))]"
        />
      ) : null}
    </div>
  );
