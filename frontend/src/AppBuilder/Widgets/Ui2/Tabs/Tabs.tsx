import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SubContainer } from '@/AppBuilder/Widgets/Ui2/_shared/SubContainer';
import { TAB_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useDynamicHeight } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import { Button, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { tabIds, tabsLook, visibleTabs, tabsFromProperties, neighbourTab } from './tabsModel';
import {
  asActions,
  useActionFire,
  useLatest,
  useStable,
  withOwnedActions,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import { TabStrip } from './TabStrip';
import type { TabsVariant } from './TabStrip';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import type { Tab, TabId } from './tabsModel';

/** What the tab actions read later, without going stale. */
interface TabsLive {
  tabs: Tab[];
  currentTab: TabId | undefined;
  fireEvent: WidgetProps['fireEvent'];
  setExposedVariables: WidgetProps['setExposedVariables'];
  setSelectedComponents: (ids: string[]) => void;
}

/** What the tabs read from the app store. */
type TabsStore = {
  setSelectedComponents: (ids: string[]) => void;
  getContainerChildrenMapping: (id: string) => string[] | undefined;
};

interface TabPanelProps {
  id: string;
  /** The widget's DOM id, for the ids that tie the panel to its tab (unique per List view row). */
  domId: string;
  tab: Tab;
  width: number;
  active: boolean;
  dynamic: boolean;
  background: string;
}

// ToolJet UI 2.0 Tabs. Same contract as the native Tabs (tabItems or dynamic tabs, defaultTab,
// currentTab, setTab and the per-tab canvases `<id>-<tabId>`), so the editor, copy and paste, dynamic height and the
// MCP's tab slots work as for Tabs. The tab strip is 50px tall and a panel has TAB_CANVAS_PADDING around its canvas,
// as dynamicHeightReflow expects; the wizard footer adds STEP_NAV_HEIGHT.
export const STEP_NAV_HEIGHT = 56;

/** One tab's panel: its canvas, with a spinner in its place while the tab is loading. A hidden or loading tab keeps
 *  its canvas mounted, only out of sight, so what was typed in its components survives (it was unmounted and lost).
 *  Memoised on its own inputs, so switching tabs re-renders only the two panels whose visibility changes. */
const TabPanel = memo(function TabPanel({ id, domId, tab, width, active, dynamic, background }: TabPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  // A disabled tab's panel blocks the keyboard as it blocks the mouse: inert takes its fields out of the tab order.
  useDisableInert(ref, tab.disable);
  // A hidden tab has no tab in the strip, so its panel is no tab panel either: no role, id or label pointing at it.
  const shown = tab.visible !== false;
  return (
    <div
      ref={ref}
      role={shown ? 'tabpanel' : undefined}
      id={shown ? tabIds(domId, tab.id).panel : undefined}
      aria-labelledby={shown ? tabIds(domId, tab.id).tab : undefined}
      aria-disabled={tab.disable || undefined}
      // activetab is ToolJet's own attribute on a tab pane (as on the native Tabs), not one React's types know.
      {...{ activetab: tab.id }}
      data-disabled={tab.disable}
      className={cn('tab-pane tw-h-full tw-w-full', dynamic && active && `dynamic-${id}`)}
      style={{
        display: active ? 'block' : 'none',
        padding: `${TAB_CANVAS_PADDING}px`,
        boxSizing: 'border-box',
        opacity: tab.disable ? 0.5 : 1,
        pointerEvents: tab.disable ? 'none' : 'auto',
      }}
    >
      {tab.loading ? (
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center" aria-busy="true">
          <Spinner />
        </div>
      ) : null}
      <div className="tw-h-full tw-w-full" hidden={tab.loading}>
        <SubContainer
          id={`${id}-${tab.id}`}
          canvasHeight={dynamic ? '100%' : '200'}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{
            overflow: dynamic ? 'hidden' : 'hidden auto',
            backgroundColor: background,
            width: '100%',
            maxWidth: '100%',
          }}
          componentType="ShadTabs"
        />
      </div>
    </div>
  );
});

export const ShadTabs = (props: WidgetProps) => {
  const {
    id,
    width,
    height,
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    currentMode,
    currentLayout,
    subContainerIndex,
    dataCy,
  } = props;
  // Events an action fires wait until it has published (useActionFire).
  const fireEvent = useActionFire(props.fireEvent);
  // A pack widget created through the MCP carries only the properties it was given (the server has no defaults to
  // merge for pack types), so an unset property means its default: visible, enabled, not loading.
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState === true,
    properties.visibility !== false,
    properties.disabledState === true,
    setExposedVariables,
    setExposedVariable
  );
  const setSelectedComponents = useStore((state: TabsStore) => state.setSelectedComponents);
  const variant: TabsVariant = ['pills', 'underline', 'steps'].includes(properties.variant)
    ? properties.variant
    : 'pills';
  const wizard = variant === 'steps';
  const dynamic = properties.dynamicHeight !== false && currentMode === 'view';
  const look = tabsLook(styles);
  // The DOM id the tab and panel ids are built from: component ids repeat in List view and Kanban rows, so a Tabs in a
  // row adds its instance's id, or each row's tab would control the first row's panel (as withControlState's domId).
  const instance = useId().replace(/[^\w-]/g, '');
  const domId = subContainerIndex == null ? id : `${id}-${instance}`;

  // Tabs from the static list or the dynamic option; a tab without an id gets its index. Kept in state so the
  // per-tab actions can change disable, loading and visibility at run time.
  const { useDynamicOptions, tabs: dynamicTabs, tabItems, defaultTab } = properties;
  const fromProps = useStable(
    useMemo(
      () => tabsFromProperties({ useDynamicOptions, tabs: dynamicTabs, tabItems }),
      [useDynamicOptions, dynamicTabs, tabItems]
    )
  );
  const [tabs, setTabs] = useState<Tab[]>(fromProps);
  useEffect(() => setTabs(fromProps), [fromProps]);
  const shown = useMemo(() => visibleTabs(tabs), [tabs]);

  const pickDefault = (visible: Tab[]): TabId | undefined =>
    visible.some((tab) => tab.id == defaultTab) ? defaultTab : visible[0]?.id;
  // The tab chosen (by default, a click or an action) is kept apart from the tab shown: the chosen tab while it is
  // visible, else the first visible tab, else none. Derived as the widget renders, so an action that hides the current
  // tab has moved to the next one by the time it returns (`await setTabVisibility('a', false); await nextTab()` lost
  // the second action), and with every tab hidden or removed nothing is current, as with an empty list.
  const [chosenTab, setCurrentTab] = useState<TabId | undefined>(() => pickDefault(shown));
  const currentTab = shown.some((tab) => tab.id == chosenTab) ? chosenTab : shown[0]?.id;
  // Only a new defaultTab moves the tab; the tabs shown then are read from a ref.
  const latestPick = useLatest(() => pickDefault(shown));
  useEffect(() => setCurrentTab(latestPick.current()), [defaultTab, latestPick]);
  // Scroll to top on tab switch: the new tab's canvas starts at its top, as the native Tabs does. Looked up in this
  // instance's own panels (its first canvas, not one nested in it): a document-wide lookup by the canvas id reset the
  // first List view row's canvas whichever row switched.
  const panelsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (properties.scrollToTopOnTabSwitch !== true) return undefined;
    const frame = requestAnimationFrame(() => {
      const panel = Array.from(panelsRef.current?.children ?? []).find(
        (child) => child.getAttribute('activetab') === String(currentTab)
      );
      const canvas = panel?.querySelector('.real-canvas');
      if (canvas) canvas.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [currentTab, properties.scrollToTopOnTabSwitch]);
  // A hidden or removed chosen tab gives way for good to the tab shown in its place.
  useEffect(() => {
    if (currentTab !== undefined && currentTab !== chosenTab) setCurrentTab(currentTab);
  }, [currentTab, chosenTab]);

  const stepIndex = Math.max(
    0,
    shown.findIndex((tab) => tab.id == currentTab)
  );
  const current = shown[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === shown.length - 1;

  // Actions run later from event handlers: they read the latest tabs and tab through refs.
  const live = useRef<TabsLive>({ tabs, currentTab, fireEvent, setExposedVariables, setSelectedComponents });
  live.current = { tabs, currentTab, fireEvent, setExposedVariables, setSelectedComponents };
  const switchTo = (tabId: unknown, { fire = true }: { fire?: boolean } = {}) => {
    const { tabs: all, currentTab: now, fireEvent: fireNow, setSelectedComponents: deselect } = live.current;
    const target = visibleTabs(all).find((tab) => tab.id == tabId);
    if (!target || target.id == now) return;
    setCurrentTab(target.id);
    // Published before the event, so its handler reads the tab it switched to (the effect below runs only after the
    // next render, and onTabSwitch handlers saw the old tab).
    const visible = visibleTabs(all);
    const index = Math.max(0, visible.indexOf(target));
    live.current.setExposedVariables({
      currentTab: target.id,
      currentTabTitle: target.title ?? '',
      currentStepIndex: index,
      isFirstStep: index === 0,
      isLastStep: index === visible.length - 1,
    });
    if (fire) fireNow('onTabSwitch');
    // The editor selection may hold a component of the tab that just went away.
    deselect([]);
  };
  const patchTab = (tabId: unknown, patch: Partial<Tab>) =>
    setTabs((all) => all.map((tab) => (tab.id == tabId ? { ...tab, ...patch } : tab)));

  // Published once; each action calls the latest handlers.
  const handlers = useLatest({ switchTo, patchTab });
  useEffect(() => {
    const act = () => handlers.current;
    live.current.setExposedVariables(
      asActions({
        setTab: async (tabId: unknown) => act().switchTo(tabId),
        nextTab: async () => {
          const next = neighbourTab(live.current.tabs, live.current.currentTab, 1);
          if (next) act().switchTo(next.id);
        },
        previousTab: async () => {
          const previous = neighbourTab(live.current.tabs, live.current.currentTab, -1);
          if (previous) act().switchTo(previous.id);
        },
        setTabDisable: async (tabId: unknown, value: unknown) => act().patchTab(tabId, { disable: !!value }),
        setTabLoading: async (tabId: unknown, value: unknown) => act().patchTab(tabId, { loading: !!value }),
        setTabVisibility: async (tabId: unknown, value: unknown) => act().patchTab(tabId, { visible: value !== false }),
      })
    );
  }, [handlers]);

  const currentTitle = current?.title ?? '';
  useEffect(() => {
    live.current.setExposedVariables({
      currentTab,
      currentTabTitle: currentTitle,
      currentStepIndex: stepIndex,
      isFirstStep,
      isLastStep,
    });
  }, [currentTab, currentTitle, stepIndex, isFirstStep, isLastStep]);

  const componentCount = useStore(
    (state: TabsStore) => state.getContainerChildrenMapping(`${id}-${currentTab}`)?.length || 0
  );
  useDynamicHeight({
    isDynamicHeightEnabled: dynamic,
    id,
    height,
    currentLayout,
    isContainer: true,
    value: `${currentTab}|${properties.hideTabs ? 1 : 0}|${variant}`,
    componentCount,
    visibility: isVisible,
    subContainerIndex,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useDisableInert(containerRef, isDisabled);

  const showNav = wizard && properties.showStepNav !== false;
  const onPick = (tab: Tab) => {
    if (tab.disable || isDisabled) return;
    switchTo(tab.id);
  };

  return (
    <div
      ref={containerRef}
      data-cy={dataCy}
      data-disabled={isDisabled}
      className="tj-shadcn"
      style={{
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
        width: '100%',
        height: dynamic ? '100%' : height,
        ...(dynamic && { minHeight: height }),
        overflow: 'hidden',
        boxShadow: styles?.boxShadow,
        ...look.container,
        ...look.vars,
      }}
    >
      {isLoading && wantsSkeleton(properties) ? (
        <div className="tw-flex tw-h-[50px] tw-items-center tw-gap-2 tw-px-3">
          <Skeleton className="tw-h-7 tw-w-24" />
          <Skeleton className="tw-h-7 tw-w-20" />
          <Skeleton className="tw-h-7 tw-w-24" />
        </div>
      ) : properties.hideTabs ? null : (
        <TabStrip
          widgetId={domId}
          onlyActivePanel={!!properties.renderOnlyActiveTab}
          tabs={shown}
          currentTab={currentTab}
          variant={variant}
          align={properties.tabsAlign}
          stepIndex={stepIndex}
          linear={properties.linearSteps !== false}
          // With the spinner look the real tabs show while loading; picking one waits for the content.
          onPick={isLoading ? () => {} : onPick}
        />
      )}
      <div
        ref={panelsRef}
        className="tw-relative tw-min-h-0 tw-w-full tw-flex-1"
        style={{ background: look.panelBackground }}
      >
        {/* Loading, the panels stay mounted beside the spinner, none of them shown: swapping them for it unmounted every
            tab's components, and what was typed in them was lost. */}
        {isLoading ? (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center" aria-busy="true">
            <Spinner />
          </div>
        ) : null}
        {/* Every tab's panel, hidden ones too (out of sight, keeping their components), unless only the current one
            is rendered. */}
        {tabs.map((tab) =>
          properties.renderOnlyActiveTab && tab.id != currentTab ? null : (
            <TabPanel
              key={tab.id}
              id={id}
              domId={domId}
              tab={tab}
              width={width}
              active={!isLoading && tab.id == currentTab}
              dynamic={dynamic}
              background={look.panelBackground}
            />
          )
        )}
      </div>
      {showNav && !isLoading ? (
        <div
          className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-2 tw-border-t tw-px-3"
          style={{ height: STEP_NAV_HEIGHT, borderColor: 'var(--tb-border, var(--sc-border))' }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isFirstStep || isDisabled}
            onClick={() => {
              const previous = neighbourTab(tabs, currentTab, -1);
              if (previous) switchTo(previous.id);
            }}
          >
            <ChevronLeft className="tw-mr-1 tw-h-4 tw-w-4" />
            {String(properties.backLabel || 'Back')}
          </Button>
          <span className="tw-text-xs tw-tabular-nums tw-text-ui2-muted-foreground">
            {shown.length ? `${stepIndex + 1} / ${shown.length}` : ''}
          </span>
          <Button
            size="sm"
            disabled={isDisabled || !!current?.loading}
            onClick={() => {
              if (isLastStep) {
                fireEvent('onFinish');
                return;
              }
              const next = neighbourTab(tabs, currentTab, 1);
              if (next) switchTo(next.id);
            }}
          >
            {isLastStep ? String(properties.finishLabel || 'Finish') : String(properties.nextLabel || 'Next')}
            {isLastStep ? null : <ChevronRight className="tw-ml-1 tw-h-4 tw-w-4" />}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default withOwnedActions(ShadTabs);
