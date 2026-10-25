import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';
import { normalizeSteps, stepIndexOf } from '../lib/ui2/nav/model';
import type { Step } from '../lib/ui2/nav/model';
import { lookVars } from '../lib/ui2/nav/look';
import { onArg, useStable } from '../lib/ui2/nav/hooks';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { StepsSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

type StepState = 'done' | 'current' | 'upcoming';
const stateOf = (index: number, current: number): StepState => (index < current ? 'done' : index === current ? 'current' : 'upcoming');

const Marker = ({ state, number, dots }: { state: StepState; number: number; dots: boolean }) =>
  dots ? (
    <span className={cn('n2-steps-dot', `is-${state}`)} />
  ) : (
    <span className={cn('n2-steps-marker', `is-${state}`)}>{state === 'done' ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : number}</span>
  );

// UI 2.0 Steps: a progress indicator (display only; Stepper is the wizard with drop areas).
export const Steps = () => {
  const [stepsRaw] = ToolJet.useStateArray({
    name: 'steps',
    label: 'Steps',
    description: 'Array of { id, name, description, tooltip, visible, disabled } objects or strings.',
    initialValue: [
      { id: 1, name: 'Account', description: 'Your details' },
      { id: 2, name: 'Company', description: 'Team and size' },
      { id: 3, name: 'Billing', description: 'Plan and payment' },
    ],
  });
  const [currentStep] = ToolJet.useStateString({ name: 'currentStep', label: 'Current step (id)', initialValue: '' });
  const [currentStepIndex, setCurrentStepIndex] = ToolJet.useStateNumber({ name: 'currentStepIndex', label: 'Current step (0-based)', initialValue: 1 });
  const [stepsSelectable] = ToolJet.useStateBoolean({ name: 'stepsSelectable', label: 'Steps selectable', initialValue: true });
  const [orientation] = ToolJet.useStateEnumeration({
    name: 'orientation',
    label: 'Orientation',
    enumDefinition: ['horizontal', 'vertical'],
    enumLabels: { horizontal: 'Horizontal', vertical: 'Vertical' },
    initialValue: 'horizontal',
    inspector: 'switch',
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Marker',
    enumDefinition: ['numbers', 'dots'],
    enumLabels: { numbers: 'Numbers', dots: 'Dots' },
    initialValue: 'numbers',
    inspector: 'switch',
  });
  const [, setCurrentStepId] = ToolJet.useStateString({ name: 'currentStepId', initialValue: '', inspector: 'hidden' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const { disabled } = ToolJet.useControlState();
  const completedAccent = useThemeColor('completedAccent', 'Completed and current accent', TOKEN.brand);
  const incompletedAccent = useThemeColor('incompletedAccent', 'Upcoming step accent (circle border, line)', TOKEN.border);
  const completedLabel = useThemeColor('completedLabel', 'Completed step label', TOKEN.text);
  const currentStepLabel = useThemeColor('currentStepLabel', 'Current step label', TOKEN.text);
  const incompletedLabel = useThemeColor('incompletedLabel', 'Upcoming step label', TOKEN.mutedText);
  const descriptionColor = useThemeColor('descriptionColor', 'Description color', TOKEN.mutedText);
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 8 });

  const source = useStable(stepsRaw);
  const base = useMemo(() => normalizeSteps(source), [source]);
  // setStepVisible and setStepDisable change one step until the Steps change.
  const [overrides, setOverrides] = useState<Record<string, Partial<Step>>>({});
  useEffect(() => setOverrides({}), [base]);
  const all = useMemo(() => base.map((s) => ({ ...s, ...(overrides[String(s.id)] ?? {}) })), [base, overrides]);
  const shown = useMemo(() => all.filter((s) => s.visible), [all]);
  const index = shown.length ? Math.min(shown.length - 1, Math.max(0, Math.round(Number(currentStepIndex) || 0))) : 0;
  const live = useRef({ all, shown, index });
  live.current = { all, shown, index };

  const moveTo = (i: number) => {
    const step = live.current.shown[i];
    if (!step) return false;
    live.current.index = i;
    setCurrentStepIndex(i);
    setCurrentStepId(String(step.id));
    return true;
  };
  // Current step (id) moves the step, as UI 2.0's does; the 0-based index stays the pack's own way to set it.
  useEffect(() => {
    if (currentStep === '' || currentStep == null) return;
    const i = stepIndexOf(live.current.shown, currentStep);
    if (i >= 0 && i !== live.current.index) moveTo(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, shown]);
  useEffect(() => {
    setCurrentStepId(shown[index] ? String(shown[index].id) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, all]);

  ToolJet.useAction({ name: 'setStep', displayName: 'Set step', params: [{ handle: 'option', displayName: 'Step id' }] }, (id) => {
    if (!disabled) moveTo(stepIndexOf(live.current.shown, id));
  });
  ToolJet.useAction({ name: 'nextStep', displayName: 'Next step' }, () => {
    moveTo(live.current.index + 1);
  });
  ToolJet.useAction({ name: 'previousStep', displayName: 'Previous step' }, () => {
    if (live.current.index > 0) moveTo(live.current.index - 1);
  });
  ToolJet.useAction({ name: 'resetSteps', displayName: 'Reset steps' }, () => {
    moveTo(0);
  });
  const override = (id: unknown, patch: Partial<Step>) => setOverrides((p) => ({ ...p, [String(id)]: { ...(p[String(id)] ?? {}), ...patch } }));
  ToolJet.useAction(
    { name: 'setStepVisible', displayName: 'Set step visibility', params: [{ handle: 'id', displayName: 'Step id' }, { handle: 'visibility', displayName: 'Visible', type: 'toggle', defaultValue: '{{true}}' }] },
    (id, v) => override(id, { visible: onArg(v) })
  );
  ToolJet.useAction(
    { name: 'setStepDisable', displayName: 'Set step disable', params: [{ handle: 'id', displayName: 'Step id' }, { handle: 'disabled', displayName: 'Disable', type: 'toggle', defaultValue: '{{true}}' }] },
    (id, v) => override(id, { disabled: onArg(v) })
  );

  const selectable = stepsSelectable !== false;
  const select = (i: number) => {
    const step = shown[i];
    if (!selectable || disabled || !step || step.disabled) return;
    moveTo(i);
    onSelect();
  };
  const vertical = orientation === 'vertical';
  const dots = variant === 'dots';
  const marker = dots ? 12 : 32;
  const vars = lookVars([
    [completedAccent, '--ui-primary'],
    [incompletedAccent, '--lk-idle'],
    [completedLabel, '--lk-done-label'],
    [currentStepLabel, '--lk-current-label'],
    [incompletedLabel, '--lk-idle-label'],
    [descriptionColor, '--lk-help'],
  ]);

  if (!shown.length) {
    return (
      <LoadingFrame loading={ld.loading} minHeight={56} look={ld.skeleton ? <StepsSkel count={shown.length} vertical={vertical} marker={variant === 'dots' ? 12 : 32} /> : <LoadingBox />}>
        <div className="ui" style={vars}>
          <p className="n2-empty">No steps</p>
        </div>
      </LoadingFrame>
    );
  }
  return (
    <LoadingFrame loading={ld.loading} minHeight={56} look={ld.skeleton ? <StepsSkel count={shown.length} vertical={vertical} marker={variant === 'dots' ? 12 : 32} /> : <LoadingBox />}>
      <div className="ui" style={vars}>
        <ol className={cn('n2-steps', vertical ? 'is-vertical' : 'is-horizontal')} aria-label="Steps">
          {shown.map((step, i) => {
            const state = stateOf(i, index);
            const isLast = i === shown.length - 1;
            const interactive = selectable && !step.disabled && !disabled;
            const line = isLast ? null : (
              <span
                aria-hidden="true"
                className={cn('n2-steps-line', i < index && 'is-done')}
                style={
                  vertical
                    ? { left: marker / 2 - 1, top: marker + 4, bottom: 4, width: 2 }
                    : { top: marker / 2 - 1, left: `calc(50% + ${marker / 2 + 8}px)`, right: `calc(-50% + ${marker / 2 + 8}px)`, height: 2 }
                }
              />
            );
            return (
              <li key={String(step.id)} className="n2-steps-item">
                {line}
                <button
                  type="button"
                  title={step.tooltip || undefined}
                  aria-current={state === 'current' ? 'step' : undefined}
                  disabled={!interactive}
                  onClick={() => select(i)}
                  className={cn('n2-steps-btn', interactive && 'is-interactive', step.disabled && 'is-disabled')}
                >
                  <Marker state={state} number={i + 1} dots={dots} />
                  {vertical ? (
                    <span className="n2-steps-text" style={{ paddingTop: dots ? 0 : 6 }}>
                      <span className={cn('n2-steps-name', `is-${state}`)} style={dots ? { marginTop: -4 } : undefined}>
                        {step.name}
                      </span>
                      {step.description ? <span className="n2-steps-desc">{step.description}</span> : null}
                    </span>
                  ) : (
                    <>
                      <span className={cn('n2-steps-name', `is-${state}`)}>{step.name}</span>
                      {step.description ? <span className="n2-steps-desc">{step.description}</span> : null}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </LoadingFrame>
  );
};
