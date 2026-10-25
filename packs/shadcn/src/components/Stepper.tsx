import React from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";
import { slotNames, toItems } from "../lib/slots";
import { useThemeRadius } from "../lib/styleDefaults";

// Wizard container: one drop area per step, with Back / Next / Finish. Every step stays mounted
// (only the current one is shown), so values entered in earlier steps are kept.
export const Stepper = () => {
  const [rawSteps] = ToolJet.useStateArray({
    name: "steps",
    label: "Steps",
    description:
      "Array of { id, label } objects. Keep ids stable: dropped components stay with their step id.",
    initialValue: [
      { id: "account", label: "Account" },
      { id: "profile", label: "Profile" },
      { id: "review", label: "Review" },
    ],
  });
  const [currentStep, setCurrentStep] = ToolJet.useStateString({
    name: "currentStep",
    label: "Start step",
    initialValue: "account",
  });
  const [finishLabel] = ToolJet.useStateString({
    name: "finishLabel",
    label: "Finish button",
    initialValue: "Finish",
  });
  // UI 2.0 Tabs' wizard (variant steps): its labels, onFinish and its exposed step position.
  const [nextLabel] = ToolJet.useStateString({ name: "nextLabel", label: "Next button", initialValue: "Next" });
  const [backLabel] = ToolJet.useStateString({ name: "backLabel", label: "Back button", initialValue: "Back" });
  const [linearSteps] = ToolJet.useStateBoolean({ name: "linearSteps", label: "Steps in order only", initialValue: false });
  const [, setCurrentStepIndex] = ToolJet.useStateNumber({ name: "currentStepIndex", initialValue: 0, inspector: "hidden" });
  const [, setIsFirstStep] = ToolJet.useStateBoolean({ name: "isFirstStep", initialValue: true, inspector: "hidden" });
  const [, setIsLastStep] = ToolJet.useStateBoolean({ name: "isLastStep", initialValue: false, inspector: "hidden" });
  const onStepChange = ToolJet.useEventCallback({ name: "onStepChange" });
  // UI 2.0's name only: the pack's earlier onComplete fired alongside it.
  const onFinish = ToolJet.useEventCallback({ name: "onFinish" });
  const { disabled } = ToolJet.useControlState();
  const accent = ToolJet.useStyleString({
    name: "accentColor",
    label: "Accent",
    inspector: "color",
    initialValue: "var(--cc-primary-brand)",
  });
  // The container's own surface, like a native container: without it the canvas grid shows through
  // around the drop areas while a component is dragged in.
  const background = ToolJet.useStyleString({
    name: "backgroundColor",
    label: "Background",
    inspector: "color",
    initialValue: "var(--cc-surface1-surface)",
  });
  const radius = useThemeRadius("borderRadius", "Border radius");
  const padding = ToolJet.useStyleNumber({
    name: "padding",
    label: "Padding",
    initialValue: 12,
    section: "Spacing",
  });
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 50 });

  const steps = toItems(rawSteps, "Step");
  const slots = slotNames("step", steps.map((s) => s.id));
  const current = String(currentStep ?? "");
  const found = steps.findIndex((s) => s.id === current);
  const index = found === -1 ? 0 : found;
  const isLast = index === steps.length - 1;
  // The step shown is the exposed one: a current step that is gone (or never named a step) falls back to the first,
  // and currentStep now says so, with no step-change event. It kept the removed id while the wizard showed another
  // step (pack audit SP-20, 2026-10-23). Same as useTabs' fallback tab.
  const shownId = steps[index]?.id;
  React.useEffect(() => {
    setCurrentStepIndex(index);
    setIsFirstStep(index === 0);
    setIsLastStep(isLast);
    if (shownId !== undefined && shownId !== current) setCurrentStep(shownId);
  }, [index, isLast, shownId, current, setCurrentStep, setCurrentStepIndex, setIsFirstStep, setIsLastStep]);
  const finish = () => onFinish();

  const goTo = (next: number) => {
    const step = steps[Math.max(0, Math.min(steps.length - 1, next))];
    if (!step || step.id === steps[index]?.id) return;
    setCurrentStep(step.id);
    onStepChange();
  };

  ToolJet.useAction({ name: "next", displayName: "Next step" }, () =>
    goTo(index + 1),
  );
  // UI 2.0 Tabs' action names.
  ToolJet.useAction({ name: "nextTab", displayName: "Next step (nextTab)" }, () => goTo(index + 1));
  ToolJet.useAction({ name: "previousTab", displayName: "Previous step (previousTab)" }, () => goTo(index - 1));
  ToolJet.useAction(
    { name: "setTab", displayName: "Go to step (setTab)", params: [{ handle: "id", displayName: "Step id" }] },
    (id) => goTo(steps.findIndex((s) => s.id === String(id))),
  );
  ToolJet.useAction({ name: "back", displayName: "Previous step" }, () =>
    goTo(index - 1),
  );
  ToolJet.useAction(
    {
      name: "goToStep",
      displayName: "Go to step",
      params: [{ handle: "id", displayName: "Step id" }],
    },
    (id) => goTo(steps.findIndex((s) => s.id === String(id))),
  );

  return (
    <div
      className="ui ui-stepper ui-surface"
      style={{
        ["--ui-primary" as string]: accent,
        background,
        borderRadius: radius === "" || radius == null ? "var(--ui-radius)" : radius,
        padding,
      }}
    >
      <ol className="ui-stepper-head">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "ui-stepper-step",
              i < index && "is-done",
              i === index && "is-current",
            )}
          >
            <button
              type="button"
              className="ui-stepper-dot ui-focus"
              disabled={disabled || (linearSteps && i > index)}
              onClick={() => goTo(i)}
              aria-label={step.label}
            >
              {i < index ? <Check size={14} /> : i + 1}
            </button>
            <span className="ui-stepper-label" title={step.label}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="ui-stepper-body">
        {steps.map((step, i) => (
          <div key={step.id} className="ui-stepper-panel" hidden={i !== index}>
            <ToolJet.Slot
              name={slots.get(step.id) as string}
              className="ui-slot-fill"
            />
          </div>
        ))}
      </div>
      <div className="ui-stepper-foot">
        <button
          type="button"
          className="ui-btn ui-btn--outline ui-btn--auto"
          disabled={index === 0 || disabled}
          onClick={() => goTo(index - 1)}
        >
          {backLabel || "Back"}
        </button>
        <button
          type="button"
          className="ui-btn ui-btn--default ui-btn--auto"
          disabled={disabled}
          onClick={() => (isLast ? finish() : goTo(index + 1))}
        >
          {isLast ? finishLabel : nextLabel || "Next"}
        </button>
      </div>
    </div>
  );
};
