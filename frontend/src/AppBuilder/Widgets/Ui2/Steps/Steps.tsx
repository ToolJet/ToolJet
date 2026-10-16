import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Check } from 'lucide-react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { normalizeSteps, stepIndexOf } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import type { Step, StepId } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';

// ---- Steps -----------------------------------------------------------------------------------------------------------

type StepState = 'done' | 'current' | 'upcoming';

const stepState = (index: number, current: number): StepState =>
  index < current ? 'done' : index === current ? 'current' : 'upcoming';

export const STEP_LABEL: Record<StepState, string> = {
  done: 'tw-text-[color:var(--lk-done-label,var(--sc-foreground))]',
  current: 'tw-text-[color:var(--lk-current-label,var(--sc-foreground))]',
  upcoming: 'tw-text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]',
};

export const IDLE = 'var(--lk-idle,var(--sc-border))';

export const StepMarker = ({ state, number, dots }: { state: StepState; number: number; dots: boolean }) => {
  if (dots) {
    return (
      <span
        className={cn(
          'tw-block tw-h-3 tw-w-3 tw-shrink-0 tw-rounded-full',
          state === 'upcoming' ? 'tw-bg-[color:var(--lk-idle,var(--sc-border))]' : 'tw-bg-ui2-primary',
          state === 'current' && 'tw-ring-4 tw-ring-[color:color-mix(in_srgb,var(--sc-primary)_18%,transparent)]'
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        'tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-text-ui2-sm tw-font-medium tw-tabular-nums tw-transition-colors',
        state === 'done' && 'tw-border-ui2-primary tw-bg-ui2-primary tw-text-ui2-primary-foreground',
        state === 'current' &&
          'tw-border-ui2-primary tw-bg-ui2-background tw-text-ui2-primary tw-ring-4 tw-ring-[color:color-mix(in_srgb,var(--sc-primary)_15%,transparent)]',
        state === 'upcoming' &&
          'tw-border-[color:var(--lk-idle,var(--sc-border))] tw-bg-ui2-background tw-text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]'
      )}
    >
      {state === 'done' ? <Check className="tw-h-4 tw-w-4" strokeWidth={2.5} aria-hidden="true" /> : number}
    </span>
  );
};

/** What the exposed actions read: the latest render's steps, current index and properties. */
interface StepsLive {
  all: Step[];
  shown: Step[];
  index: number;
  properties: Resolved;
}

export const ShadSteps = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const source = useStable(p.steps);
  const base = useMemo(() => normalizeSteps(source), [source]);
  const [overrides, setOverrides] = useState<Record<string, Partial<Step>>>({});
  useEffect(() => setOverrides({}), [base]);
  const all = useMemo(() => base.map((s) => ({ ...s, ...(overrides[String(s.id)] || {}) })), [base, overrides]);
  const shown = useMemo(() => all.filter((s) => s.visible), [all]);
  const [current, setCurrent] = useState<unknown>(p.currentStep);
  useEffect(() => setCurrent(p.currentStep), [p.currentStep]);
  const index = stepIndexOf(shown, current);
  const live = useRef<StepsLive>({ all, shown, index, properties: p });
  live.current = { all, shown, index, properties: p };
  const exposedSteps = all.map(({ id, name, description, visible, disabled }) => ({
    id,
    name,
    description,
    visible,
    disabled,
  }));
  const moveTo = (id: StepId) => {
    setCurrent(id);
    const i = stepIndexOf(live.current.shown, id);
    setExposedVariables({ currentStepId: id, currentStepIndex: i });
  };
  const override = (id: unknown, patch: Partial<Step>) =>
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...patch } }));
  useExposed(setExposedVariables, p, {
    currentStepId: current ?? null,
    currentStepIndex: index,
    steps: exposedSteps,
    setStep: async (id: unknown) => {
      if (live.current.properties.disabledState) return;
      const i = stepIndexOf(live.current.all, id);
      if (i !== -1) moveTo(live.current.all[i].id);
    },
    nextStep: async () => {
      const { shown: s, index: i } = live.current;
      if (s[i + 1]) moveTo(s[i + 1].id);
    },
    previousStep: async () => {
      const { shown: s, index: i } = live.current;
      if (i > 0 && s[i - 1]) moveTo(s[i - 1].id);
    },
    resetSteps: async () => {
      const first = live.current.shown[0];
      if (first) moveTo(first.id);
    },
    setStepVisible: async (id: unknown, visibility: unknown) =>
      override(id, { visible: visibility !== false && visibility !== 'false' }),
    setStepDisable: async (id: unknown, disabled: unknown) =>
      override(id, { disabled: disabled !== false && disabled !== 'false' }),
  });
  const selectable = p.stepsSelectable !== false;
  const select = (step: Step) => {
    if (!selectable || busy(p) || step.disabled) return;
    moveTo(step.id);
    fireEvent('onSelect');
  };
  const vertical = p.orientation === 'vertical';
  const dots = p.variant === 'dots';
  const markerSize = dots ? 12 : 32;
  if (p.loadingState && !wantsSkeleton(p)) {
    return (
      <Shell {...props} innerRef={ref}>
        <LoadingBox height={props.height} />
      </Shell>
    );
  }
  if (p.loadingState) {
    const n = Math.max(2, Math.min(6, shown.length || 4));
    return (
      <Shell {...props} innerRef={ref}>
        <div className={cn('tw-flex', vertical ? 'tw-flex-col tw-gap-6' : 'tw-flex-row tw-items-start tw-gap-4')}>
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              className={cn(
                'tw-flex tw-flex-1 tw-gap-2',
                vertical ? 'tw-flex-row tw-items-center' : 'tw-flex-col tw-items-center'
              )}
            >
              <Skeleton className="tw-shrink-0 tw-rounded-full" style={{ width: markerSize, height: markerSize }} />
              <Skeleton className="tw-h-4 tw-w-20" />
            </div>
          ))}
        </div>
      </Shell>
    );
  }
  const stepButton = (step: Step, i: number, state: StepState, children: ReactNode, className: string) => {
    const interactive = selectable && !step.disabled && !p.disabledState;
    return (
      <button
        type="button"
        title={step.tooltip || undefined}
        aria-current={state === 'current' ? 'step' : undefined}
        disabled={!interactive || !!p.loadingState}
        onClick={() => select(step)}
        className={cn(
          'tw-group tw-flex tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-default',
          interactive && 'tw-cursor-pointer',
          step.disabled && 'tw-opacity-50',
          'tw-rounded-ui2-md',
          className
        )}
      >
        {children}
      </button>
    );
  };
  return (
    <Shell {...props} innerRef={ref}>
      {!shown.length ? (
        <p className="tw-py-2 tw-text-ui2-sm tw-text-ui2-muted-foreground">No steps</p>
      ) : vertical ? (
        <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li key={String(step.id)} className={cn('tw-relative', !isLast && 'tw-pb-6')}>
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="tw-absolute tw-w-0.5 tw-rounded-full"
                    style={{
                      left: markerSize / 2 - 1,
                      top: markerSize + 4,
                      bottom: 4,
                      background: i < index ? 'var(--sc-primary)' : IDLE,
                    }}
                  />
                ) : null}
                {stepButton(
                  step,
                  i,
                  state,
                  <>
                    <StepMarker state={state} number={i + 1} dots={dots} />
                    <span className="tw-flex tw-min-w-0 tw-flex-col" style={{ paddingTop: dots ? 0 : 6 }}>
                      <span
                        className={cn(
                          'tw-text-ui2-sm tw-leading-5',
                          state === 'upcoming' ? 'tw-font-medium' : 'tw-font-semibold',
                          STEP_LABEL[state]
                        )}
                        style={dots ? { marginTop: -4 } : undefined}
                      >
                        {step.name}
                      </span>
                      {step.description ? (
                        <span className="tw-text-xs tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                          {step.description}
                        </span>
                      ) : null}
                    </span>
                  </>,
                  'tw-w-full tw-items-start tw-gap-3'
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="tw-m-0 tw-flex tw-w-full tw-list-none tw-items-start tw-p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li
                key={String(step.id)}
                className="tw-relative tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center"
              >
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="tw-absolute tw-h-0.5 tw-rounded-full"
                    style={{
                      top: markerSize / 2 - 1,
                      left: `calc(50% + ${markerSize / 2 + 8}px)`,
                      right: `calc(-50% + ${markerSize / 2 + 8}px)`,
                      background: i < index ? 'var(--sc-primary)' : IDLE,
                    }}
                  />
                ) : null}
                {stepButton(
                  step,
                  i,
                  state,
                  <>
                    <StepMarker state={state} number={i + 1} dots={dots} />
                    <span
                      className={cn(
                        'tw-mt-2 tw-block tw-max-w-full tw-truncate tw-text-ui2-sm tw-leading-5',
                        state === 'upcoming' ? 'tw-font-medium' : 'tw-font-semibold',
                        STEP_LABEL[state]
                      )}
                    >
                      {step.name}
                    </span>
                    {step.description ? (
                      <span className="tw-line-clamp-2 tw-block tw-max-w-full tw-text-xs tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                        {step.description}
                      </span>
                    ) : null}
                  </>,
                  'tw-max-w-full tw-flex-col tw-items-center tw-px-1 tw-text-center'
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Shell>
  );
};

export default withControlState(ShadSteps);
