import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { normalizeSteps, stepIndexOf } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';

// ---- Steps -----------------------------------------------------------------------------------------------------------

const stepState = (index, current) => (index < current ? 'done' : index === current ? 'current' : 'upcoming');

export const STEP_LABEL = {
  done: 'text-[color:var(--lk-done-label,var(--sc-foreground))]',
  current: 'text-[color:var(--lk-current-label,var(--sc-foreground))]',
  upcoming: 'text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]',
};

export const IDLE = 'var(--lk-idle,var(--sc-border))';

export const StepMarker = ({ state, number, dots }) => {
  if (dots) {
    return (
      <span
        className={cn(
          'block h-3 w-3 shrink-0 rounded-full',
          state === 'upcoming' ? 'bg-[color:var(--lk-idle,var(--sc-border))]' : 'bg-primary',
          state === 'current' && 'ring-4 ring-[color:color-mix(in_srgb,var(--sc-primary)_18%,transparent)]'
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium tabular-nums transition-colors',
        state === 'done' && 'border-primary bg-primary text-primary-foreground',
        state === 'current' &&
          'border-primary bg-background text-primary ring-4 ring-[color:color-mix(in_srgb,var(--sc-primary)_15%,transparent)]',
        state === 'upcoming' &&
          'border-[color:var(--lk-idle,var(--sc-border))] bg-background text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]'
      )}
    >
      {state === 'done' ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> : number}
    </span>
  );
};

export const ShadSteps = (props) => {
  const { properties: p, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const source = p.steps;
  const base = useMemo(() => normalizeSteps(source), [stringify(source ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [overrides, setOverrides] = useState({});
  useEffect(() => setOverrides({}), [base]);
  const all = base.map((s) => ({ ...s, ...(overrides[String(s.id)] || {}) }));
  const shown = all.filter((s) => s.visible);
  const [current, setCurrent] = useState(p.currentStep);
  useEffect(() => setCurrent(p.currentStep), [p.currentStep]);
  const index = stepIndexOf(shown, current);
  const live = useRef({});
  live.current = { all, shown, index, properties: p };
  const exposedSteps = all.map(({ id, name, description, visible, disabled }) => ({
    id,
    name,
    description,
    visible,
    disabled,
  }));
  const moveTo = (id) => {
    setCurrent(id);
    const i = stepIndexOf(live.current.shown, id);
    setExposedVariables({ currentStepId: id, currentStepIndex: i });
  };
  const override = (id, patch) =>
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...patch } }));
  useExposed(setExposedVariables, p, {
    currentStepId: current ?? null,
    currentStepIndex: index,
    steps: exposedSteps,
    setStep: async (id) => {
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
    setStepVisible: async (id, visibility) => override(id, { visible: visibility !== false && visibility !== 'false' }),
    setStepDisable: async (id, disabled) => override(id, { disabled: disabled !== false && disabled !== 'false' }),
  });
  const selectable = p.stepsSelectable !== false;
  const select = (step) => {
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
        <div className={cn('flex', vertical ? 'flex-col gap-6' : 'flex-row items-start gap-4')}>
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              className={cn('flex flex-1 gap-2', vertical ? 'flex-row items-center' : 'flex-col items-center')}
            >
              <Skeleton className="shrink-0 rounded-full" style={{ width: markerSize, height: markerSize }} />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Shell>
    );
  }
  const stepButton = (step, i, state, children, className) => {
    const interactive = selectable && !step.disabled && !p.disabledState;
    return (
      <button
        type="button"
        title={step.tooltip || undefined}
        aria-current={state === 'current' ? 'step' : undefined}
        disabled={!interactive || !!p.loadingState}
        onClick={() => select(step)}
        className={cn(
          'group flex bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
          interactive && 'cursor-pointer',
          step.disabled && 'opacity-50',
          'rounded-md',
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
        <p className="py-2 text-sm text-muted-foreground">No steps</p>
      ) : vertical ? (
        <ol className="m-0 flex list-none flex-col p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li key={String(step.id)} className={cn('relative', !isLast && 'pb-6')}>
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute w-0.5 rounded-full"
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
                    <span className="flex min-w-0 flex-col" style={{ paddingTop: dots ? 0 : 6 }}>
                      <span
                        className={cn(
                          'text-sm leading-5',
                          state === 'upcoming' ? 'font-medium' : 'font-semibold',
                          STEP_LABEL[state]
                        )}
                        style={dots ? { marginTop: -4 } : undefined}
                      >
                        {step.name}
                      </span>
                      {step.description ? (
                        <span className="text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                          {step.description}
                        </span>
                      ) : null}
                    </span>
                  </>,
                  'w-full items-start gap-3'
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="m-0 flex w-full list-none items-start p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li key={String(step.id)} className="relative flex min-w-0 flex-1 flex-col items-center">
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute h-0.5 rounded-full"
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
                        'mt-2 block max-w-full truncate text-sm leading-5',
                        state === 'upcoming' ? 'font-medium' : 'font-semibold',
                        STEP_LABEL[state]
                      )}
                    >
                      {step.name}
                    </span>
                    {step.description ? (
                      <span className="line-clamp-2 block max-w-full text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                        {step.description}
                      </span>
                    ) : null}
                  </>,
                  'max-w-full flex-col items-center px-1 text-center'
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
