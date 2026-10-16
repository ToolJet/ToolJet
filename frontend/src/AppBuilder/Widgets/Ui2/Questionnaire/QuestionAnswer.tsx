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
      'group/answer tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border tw-px-3.5 tw-py-3 tw-text-left tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-ring))_50%,transparent)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60',
      checked
        ? 'tw-border-[color:var(--lk-accent,var(--sc-primary))] tw-bg-[color:color-mix(in_srgb,var(--lk-accent,var(--sc-primary))_7%,transparent)]'
        : 'tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-transparent hover:tw-bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
    )}
  >
    {shortcut ? (
      <kbd
        className={cn(
          'tw-flex tw-h-6 tw-min-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-md tw-border tw-px-1.5 tw-font-sans tw-text-xs tw-font-medium tw-transition-colors',
          checked
            ? 'tw-border-transparent tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-text-[color:var(--sc-primary-foreground)]'
            : 'tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--sc-background)] tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]'
        )}
        aria-hidden="true"
      >
        {shortcut}
      </kbd>
    ) : null}
    <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5">
      <span className="tw-text-ui2-sm tw-font-medium tw-leading-snug tw-text-[color:var(--lk-title,var(--sc-foreground))]">
        {label}
      </span>
      {description ? (
        <span className="tw-text-xs tw-leading-snug tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
          {description}
        </span>
      ) : null}
    </span>
    <span
      className={cn(
        'tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-border tw-transition-colors [&_svg]:tw-size-3.5',
        role === 'radio' ? 'tw-rounded-full' : 'tw-rounded-[5px]',
        checked
          ? 'tw-border-transparent tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-text-[color:var(--sc-primary-foreground)]'
          : 'tw-border-[color:var(--lk-border,var(--sc-input))] tw-bg-transparent tw-text-transparent'
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
      className="tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border-[color:var(--lk-border,var(--sc-input))]"
    />
  ) : item.type === 'text' ? (
    <Textarea
      aria-labelledby={promptId}
      aria-invalid={error ? true : undefined}
      value={answer.text}
      placeholder={item.placeholder || 'Type your answer'}
      disabled={disabled}
      onChange={(e) => update({ ...answer, text: e.target.value })}
      className="tw-min-h-[96px] tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border-[color:var(--lk-border,var(--sc-input))]"
    />
  ) : (
    <div
      role={item.type === 'single' ? 'radiogroup' : 'group'}
      aria-labelledby={promptId}
      aria-required={item.required || undefined}
      className="tw-flex tw-flex-col tw-gap-2"
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
          className="tw-mt-1 tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border-[color:var(--lk-border,var(--sc-input))]"
        />
      ) : null}
    </div>
  );
