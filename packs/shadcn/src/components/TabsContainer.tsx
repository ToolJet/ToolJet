import React, { useEffect, useRef } from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MAX_SLOT_ITEMS, toSlotName } from "../lib/slots";
import { cn } from "../lib/cn";
import { lookVars, px } from "../lib/ui2/nav/look";
import { useTabs } from "../lib/ui2/nav/hooks";
import { Spinner, TabStrip } from "../lib/ui2/nav/parts";
import type { TabsVariant } from "../lib/ui2/nav/parts";
import { LoadingBox, useLoadingLook } from "../lib/ui2/loading/look";
import { TabStripSkel } from "../lib/ui2/loading/shapes";
import "../styles/ui2-nav.css";

// UI 2.0 Tabs as a container: one drop area per tab (slot tab_<id>). Tabs come from a property, so the slots are
// dynamic; every tab's slot (and the components in it) stays mounted while it is hidden, unless only the active tab
// is rendered. Same contract as UI 2.0 Tabs: variants (pills, underline, a steps wizard), per-tab icon, badge,
// disable, loading and visibility, the tab actions and onTabSwitch.
export const TabsContainer = () => {
  const [rawTabs] = ToolJet.useStateArray({
    name: "tabs",
    label: "Tabs",
    description:
      "Array of { id, label, icon, badge, disable, visible, loading }. Keep ids stable: dropped components stay with their tab id.",
    initialValue: [
      { id: "details", label: "Details" },
      { id: "activity", label: "Activity" },
    ],
  });
  const [current, setCurrent] = ToolJet.useStateString({
    name: "currentTab",
    label: "Current tab",
    initialValue: "details",
  });
  const [defaultTab] = ToolJet.useStateString({ name: "defaultTab", label: "Default tab", initialValue: "" });
  const [variant] = ToolJet.useStateEnumeration({
    name: "variant",
    label: "Style",
    enumDefinition: ["pills", "underline", "steps"],
    enumLabels: { pills: "Pills", underline: "Underline", steps: "Steps" },
    initialValue: "pills",
    inspector: "switch",
  });
  const [tabsAlign] = ToolJet.useStateEnumeration({
    name: "tabsAlign",
    label: "Tab alignment",
    enumDefinition: ["start", "center", "stretch"],
    enumLabels: { start: "Start", center: "Center", stretch: "Stretch" },
    initialValue: "start",
    inspector: "switch",
  });
  const [orientation] = ToolJet.useStateEnumeration({
    name: "orientation",
    label: "Orientation",
    enumDefinition: ["horizontal", "vertical"],
    enumLabels: { horizontal: "Top", vertical: "Side" },
    initialValue: "horizontal",
    inspector: "switch",
  });
  const [hideTabs] = ToolJet.useStateBoolean({ name: "hideTabs", label: "Hide tabs", initialValue: false });
  const [renderOnlyActiveTab] = ToolJet.useStateBoolean({ name: "renderOnlyActiveTab", label: "Render only active tab", initialValue: false });
  const [scrollToTop] = ToolJet.useStateBoolean({ name: "scrollToTopOnTabSwitch", label: "Scroll to top on tab switch", initialValue: false });
  const [showStepNav] = ToolJet.useStateBoolean({ name: "showStepNav", label: "Wizard: Back and Next buttons", initialValue: true, visibleWhen: { key: "variant", value: "steps" } });
  const [nextLabel] = ToolJet.useStateString({ name: "nextLabel", label: "Wizard: Next label", initialValue: "Next", visibleWhen: { key: "variant", value: "steps" } });
  const [backLabel] = ToolJet.useStateString({ name: "backLabel", label: "Wizard: Back label", initialValue: "Back", visibleWhen: { key: "variant", value: "steps" } });
  const [finishLabel] = ToolJet.useStateString({ name: "finishLabel", label: "Wizard: Finish label", initialValue: "Finish", visibleWhen: { key: "variant", value: "steps" } });
  const [linearSteps] = ToolJet.useStateBoolean({ name: "linearSteps", label: "Wizard: steps in order only", initialValue: true, visibleWhen: { key: "variant", value: "steps" } });
  const onChange = ToolJet.useEventCallback({ name: "onChange" });
  const onTabSwitch = ToolJet.useEventCallback({ name: "onTabSwitch" });
  const onFinish = ToolJet.useEventCallback({ name: "onFinish" });
  const { disabled } = ToolJet.useControlState();

  const accent = ToolJet.useStyleString({ name: "accentColor", label: "Accent (active step, focus ring)", inspector: "color", initialValue: "" });
  const tabListBackground = ToolJet.useStyleString({ name: "tabListBackground", label: "Tab bar background", inspector: "color", initialValue: "" });
  const tabTextColor = ToolJet.useStyleString({ name: "tabTextColor", label: "Tab text color", inspector: "color", initialValue: "" });
  const activeTabTextColor = ToolJet.useStyleString({ name: "activeTabTextColor", label: "Active tab text color", inspector: "color", initialValue: "" });
  const activeTabBackground = ToolJet.useStyleString({ name: "activeTabBackground", label: "Active tab background (pills)", inspector: "color", initialValue: "" });
  const indicatorColor = ToolJet.useStyleString({ name: "indicatorColor", label: "Active tab indicator (underline)", inspector: "color", initialValue: "" });
  const panelBackground = ToolJet.useStyleString({ name: "panelBackground", label: "Panel background", inspector: "color", initialValue: "" });
  const borderColor = ToolJet.useStyleString({ name: "borderColor", label: "Border color", inspector: "color", initialValue: "" });
  // The container's own surface, like a native container: without it the canvas grid shows through around the drop
  // areas while a component is dragged in.
  const background = ToolJet.useStyleString({ name: "backgroundColor", label: "Background", inspector: "color", initialValue: "" });
  const radius = ToolJet.useStyleNumber({ name: "borderRadius", label: "Radius", initialValue: "" });
  const tabFontSize = ToolJet.useStyleNumber({ name: "tabFontSize", label: "Tab font size", initialValue: "" });
  const showBorder = ToolJet.useStyleBoolean({ name: "showBorder", label: "Border around tabs", initialValue: true });
  const padding = ToolJet.useStyleNumber({ name: "padding", label: "Padding", initialValue: 12, section: "Spacing" });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 40 });

  const t = useTabs({
    // Each tab is a canvas: a binding to a large list draws at most MAX_SLOT_ITEMS of them.
    raw: Array.isArray(rawTabs) ? rawTabs.slice(0, MAX_SLOT_ITEMS) : rawTabs,
    fallbackLabel: "Tab",
    current,
    setCurrent,
    defaultTab,
    setTabParam: "id",
    onSwitched: () => {
      onChange();
      onTabSwitch();
    },
  });
  const style: TabsVariant = (["pills", "underline", "steps"] as const).includes(variant as TabsVariant) ? (variant as TabsVariant) : "pills";
  const wizard = style === "steps";
  // A wizard's numbered strip runs across the top.
  const vertical = orientation === "vertical" && !wizard;

  // Scroll to top on tab switch: the new tab's canvas starts at its top.
  const panelsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollToTop) return undefined;
    const frame = requestAnimationFrame(() => {
      const panel = Array.from(panelsRef.current?.children ?? []).find((el) => (el as HTMLElement).dataset.tabPanel === t.active);
      for (const el of panel?.querySelector("slot")?.assignedElements?.() ?? []) {
        el.scrollTop = 0;
        el.querySelectorAll<HTMLElement>(".real-canvas").forEach((canvas) => (canvas.scrollTop = 0));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [t.active, scrollToTop]);

  const vars = lookVars([
    [accent, "--ui-primary"],
    [tabListBackground, "--tb-list-bg"],
    [tabTextColor, "--tb-text"],
    [activeTabTextColor, "--tb-active-text"],
    [activeTabBackground, "--tb-active-bg"],
    [indicatorColor, "--tb-indicator"],
    [borderColor, "--tb-border"],
    [tabFontSize, "--tb-font", px],
  ]);

  return (
    <div
      className={cn("ui n2-tabs", vertical && "is-vertical", showBorder === false && "no-border")}
      style={{
        ...vars,
        ...(background ? { background } : {}),
        ...(radius === "" || radius == null ? {} : { borderRadius: px(radius) }),
      }}
    >
      {/* Loading, UI 2.0's look: the tab strip as skeletons (Skeleton look) or the real tabs, inert (Spinner look);
          the panels stay mounted, none shown, beside a spinner. */}
      {ld.skeleton ? (
        <TabStripSkel />
      ) : hideTabs ? null : (
        <TabStrip
          tabs={t.shown}
          current={t.active}
          variant={style}
          align={tabsAlign}
          vertical={vertical}
          stepIndex={t.stepIndex}
          linear={linearSteps !== false}
          disabled={disabled}
          onPick={(tab) => !ld.loading && t.switchTo(tab.id)}
        />
      )}
      <div className="n2-tabs-body">
        <div ref={panelsRef} className="n2-tabs-panels" style={panelBackground ? { background: panelBackground } : undefined}>
          {/* Every tab's panel, hidden ones too (out of sight, keeping their components), unless only the current one
              is rendered. */}
          {ld.loading ? <LoadingBox /> : null}
          {t.tabs.map((tab) =>
            renderOnlyActiveTab && tab.id !== t.active ? null : (
              <div
                key={tab.id}
                role={tab.visible ? "tabpanel" : undefined}
                data-tab-panel={tab.id}
                hidden={ld.loading || tab.id !== t.active}
                aria-disabled={tab.disable || undefined}
                className={cn("n2-tab-panel", tab.disable && "is-disabled")}
                style={{ padding: px(padding === "" || padding == null ? 0 : padding) }}
              >
                {tab.loading ? (
                  <div className="n2-tab-loading" aria-busy="true">
                    <Spinner />
                  </div>
                ) : null}
                <ToolJet.Slot name={toSlotName("tab", tab.id)} className="ui-slot-fill" style={tab.loading ? { display: "none" } : undefined} />
              </div>
            )
          )}
        </div>
        {wizard && showStepNav !== false ? (
          <div className="n2-wizard-nav">
            <button type="button" className="ui-btn ui-btn--outline ui-btn--sm ui-btn--auto" disabled={t.isFirstStep || disabled} onClick={() => t.step(-1)}>
              <ChevronLeft size={16} />
              {backLabel || "Back"}
            </button>
            <span className="n2-wizard-count">{t.shown.length ? `${t.stepIndex + 1} / ${t.shown.length}` : ""}</span>
            <button
              type="button"
              className="ui-btn ui-btn--default ui-btn--sm ui-btn--auto"
              disabled={disabled || !!t.tab?.loading}
              onClick={() => (t.isLastStep ? onFinish() : t.step(1))}
            >
              {t.isLastStep ? finishLabel || "Finish" : nextLabel || "Next"}
              {t.isLastStep ? null : <ChevronRight size={16} />}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
