import React from 'react';
import type { CSSProperties } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/AppBuilder/Widgets/Ui2/_shared/ui';

// ToolJet UI 2.0 Questionnaire (Questionnaire.tsx): the progress above a question and the screen after a submit.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';

/** "Question 3 of 8" (and Optional) over a bar of the way through. */
export const QuestionProgress = ({ at, count, optional }: { at: number; count: number; optional: boolean }) => (
  <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-2">
    <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
      <span className="tw-tabular-nums">{`Question ${at + 1} of ${count}`}</span>
      {optional ? <span>Optional</span> : null}
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
        style={{ width: `${Math.round(((at + 1) / count) * 100)}%`, background: ACCENT }}
      />
    </div>
  </div>
);

interface DoneProps {
  title: string;
  text: string;
  titleStyle: CSSProperties;
  disabled: boolean;
  onEdit: () => void;
}

/** The screen after a submit: a check, the complete title and text, and Edit answers. */
export const QuestionnaireDone = ({ title, text, titleStyle, disabled, onEdit }: DoneProps) => (
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
      {title}
    </h3>
    {text ? (
      <p className="tw-m-0 tw-max-w-sm tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
        {text}
      </p>
    ) : null}
    <Button variant="ghost" size="sm" disabled={disabled} onClick={onEdit}>
      Edit answers
    </Button>
  </div>
);
