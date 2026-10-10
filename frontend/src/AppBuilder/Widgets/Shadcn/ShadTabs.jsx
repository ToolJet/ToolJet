import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { TAB_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { Button, Skeleton, cn } from './ui';
import { tabsLook, visibleTabs, tabsFromProperties, neighbourTab } from './tabsModel';
import { stringify } from '../packJson';
import { wantsSkeleton } from './loadingLook';
import './shadcn.scss';

// shadcn/ui pack Tabs (experiment). Same contract as the native Tabs (tabItems or dynamic tabs, defaultTab,
// currentTab, setTab and the per-tab canvases `<id>-<tabId>`), so the editor, copy and paste, dynamic height and the
// MCP's tab slots work as for Tabs. The tab strip is 50px tall and a panel has TAB_CANVAS_PADDING around its canvas,
// as dynamicHeightReflow expects; the wizard footer adds STEP_NAV_HEIGHT.
export const STEP_NAV_HEIGHT = 56;

const Spinner = () => (
  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
);

const TabIcon = ({ tab }) =>
  tab?.iconVisibility && tab?.icon ? (
    <TablerIcon iconName={tab.icon} style={{ width: 16, height: 16 }} stroke={1.75} />
  ) : null;

/** The tab strip in one of the three styles. Stays 50px tall (the reflow's TABS_TAB_BAR_HEIGHT). */
const TabStrip = ({ tabs, currentTab, variant, align, stepIndex, linear, onPick }) => {
  const justify = align === 'center' ? 'justify-center' : 'justify-start';
  const stretch = align === 'stretch';
  if (variant === 'steps') {
    return (
      <div role="tablist" className={cn('flex h-[50px] items-center gap-2 px-3', justify)}>
        {tabs.map((tab, index) => {
          const done = index < stepIndex;
          const active = tab.id == currentTab;
          const reachable = !linear || index <= stepIndex;
          return (
            <React.Fragment key={tab.id}>
              {index > 0 ? (
                <div
                  aria-hidden="true"
                  className={cn('h-px min-w-[16px] flex-1', done || active ? 'bg-primary' : 'bg-border')}
                />
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={active}
                disabled={!!tab.disable || !reachable}
                onClick={() => onPick(tab)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors disabled:cursor-not-allowed',
                  active
                    ? 'font-semibold text-[color:var(--tb-active-text,var(--sc-foreground))]'
                    : 'text-[color:var(--tb-text,var(--sc-muted-foreground))]',
                  tab.disable && 'opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                    active && 'border-primary bg-primary text-primary-foreground',
                    done && 'border-primary bg-primary/10 text-primary',
                    !active && !done && 'border-border bg-background'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="max-w-[160px] truncate">{String(tab.title ?? '')}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={cn('flex h-[50px] items-end gap-1 overflow-x-auto overflow-y-hidden border-b px-3', justify)}
        style={{ borderColor: 'var(--tb-border, var(--sc-border))' }}
      >
        {tabs.map((tab) => {
          const active = tab.id == currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!!tab.disable}
              onClick={() => onPick(tab)}
              className={cn(
                '-mb-px flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[length:var(--tb-font,0.875rem)] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
                stretch && 'flex-1',
                active
                  ? 'border-[color:var(--tb-indicator,var(--sc-primary))] text-[color:var(--tb-active-text,var(--sc-foreground))]'
                  : 'border-transparent text-[color:var(--tb-text,var(--sc-muted-foreground))] hover:text-[color:var(--tb-active-text,var(--sc-foreground))]'
              )}
            >
              <TabIcon tab={tab} />
              {String(tab.title ?? '')}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={cn('flex h-[50px] items-center overflow-x-auto overflow-y-hidden px-3', justify)}>
      <div
        role="tablist"
        className={cn(
          'inline-flex h-9 items-center rounded-lg bg-[color:var(--tb-list-bg,var(--sc-muted))] p-1 text-[color:var(--tb-text,var(--sc-muted-foreground))]',
          stretch && 'flex w-full'
        )}
      >
        {tabs.map((tab) => {
          const active = tab.id == currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!!tab.disable}
              onClick={() => onPick(tab)}
              className={cn(
                'inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[length:var(--tb-font,0.875rem)] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                stretch && 'flex-1',
                active &&
                  'bg-[color:var(--tb-active-bg,var(--sc-background))] text-[color:var(--tb-active-text,var(--sc-foreground))] shadow-sm'
              )}
            >
              <TabIcon tab={tab} />
              {String(tab.title ?? '')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** One tab's panel: its canvas, or a spinner while the tab is loading. Memoised on its own inputs, so switching
 *  tabs re-renders only the two panels whose visibility changes. */
const TabPanel = memo(function TabPanel({ id, tab, width, active, dynamic, background }) {
  if (tab.visible === false) return null;
  return (
    <div
      role="tabpanel"
      activetab={tab.id}
      data-disabled={tab.disable}
      className={cn('tab-pane h-full w-full', dynamic && active && `dynamic-${id}`)}
      style={{
        display: active ? 'block' : 'none',
        padding: `${TAB_CANVAS_PADDING}px`,
        boxSizing: 'border-box',
        opacity: tab.disable ? 0.5 : 1,
        pointerEvents: tab.disable ? 'none' : 'auto',
      }}
    >
      {tab.loading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
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
      )}
    </div>
  );
});

export const ShadTabs = (props) => {
  const {
    id,
    width,
    height,
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    fireEvent,
    currentMode,
    currentLayout,
    subContainerIndex,
    componentType,
    dataCy,
  } = props;
  // A pack widget created through the MCP carries only the properties it was given (the server has no defaults to
  // merge for pack types), so an unset property means its default: visible, enabled, not loading.
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState === true,
    properties.visibility !== false,
    properties.disabledState === true,
    setExposedVariables,
    setExposedVariable
  );
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const variant = ['pills', 'underline', 'steps'].includes(properties.variant) ? properties.variant : 'pills';
  const wizard = variant === 'steps';
  const dynamic = properties.dynamicHeight !== false && currentMode === 'view';
  const look = tabsLook(styles);

  // Tabs from the static list or the dynamic option; a tab without an id gets its index. Kept in state so the
  // per-tab actions can change disable, loading and visibility at run time.
  const fromProps = useMemo(
    () => tabsFromProperties(properties),
    [properties.useDynamicOptions, properties.tabs, properties.tabItems]
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const fromPropsKey = stringify(fromProps);
  const [tabs, setTabs] = useState(fromProps);
  useEffect(() => setTabs(fromProps), [fromPropsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = visibleTabs(tabs);

  const pickDefault = () => {
    const wanted = properties.defaultTab;
    return shown.some((tab) => tab.id == wanted) ? wanted : shown[0]?.id;
  };
  const [currentTab, setCurrentTab] = useState(pickDefault);
  useEffect(() => setCurrentTab(pickDefault()), [properties.defaultTab]); // eslint-disable-line react-hooks/exhaustive-deps
  // A hidden or removed current tab falls back to the first visible one.
  useEffect(() => {
    if (shown.length && !shown.some((tab) => tab.id == currentTab)) setCurrentTab(shown[0].id);
  }, [fromPropsKey, tabs]); // eslint-disable-line react-hooks/exhaustive-deps

  const stepIndex = Math.max(
    0,
    shown.findIndex((tab) => tab.id == currentTab)
  );
  const current = shown[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === shown.length - 1;

  // Actions run later from event handlers: they read the latest tabs and tab through refs.
  const live = useRef({});
  live.current = { tabs, currentTab, fireEvent, setExposedVariables, setSelectedComponents };
  const switchTo = (tabId, { fire = true } = {}) => {
    const { tabs: all, currentTab: now, fireEvent: fireNow, setSelectedComponents: deselect } = live.current;
    const target = visibleTabs(all).find((tab) => tab.id == tabId);
    if (!target || target.id == now) return;
    setCurrentTab(target.id);
    if (fire) fireNow('onTabSwitch');
    // The editor selection may hold a component of the tab that just went away.
    deselect([]);
  };
  const patchTab = (tabId, patch) => setTabs((all) => all.map((tab) => (tab.id == tabId ? { ...tab, ...patch } : tab)));

  useEffect(() => {
    setExposedVariables({
      setTab: async (tabId) => switchTo(tabId),
      nextTab: async () => {
        const next = neighbourTab(live.current.tabs, live.current.currentTab, 1);
        if (next) switchTo(next.id);
      },
      previousTab: async () => {
        const previous = neighbourTab(live.current.tabs, live.current.currentTab, -1);
        if (previous) switchTo(previous.id);
      },
      setTabDisable: async (tabId, value) => patchTab(tabId, { disable: !!value }),
      setTabLoading: async (tabId, value) => patchTab(tabId, { loading: !!value }),
      setTabVisibility: async (tabId, value) => patchTab(tabId, { visible: value !== false }),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setExposedVariables({
      currentTab,
      currentTabTitle: current?.title ?? '',
      currentStepIndex: stepIndex,
      isFirstStep,
      isLastStep,
    });
  }, [currentTab, current?.title, stepIndex, isFirstStep, isLastStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const componentCount = useStore(
    (state) => state.getContainerChildrenMapping(`${id}-${currentTab}`)?.length || 0,
    shallow
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
    componentType,
  });

  const containerRef = useRef(null);
  useDisableInert(containerRef, isDisabled);

  const showNav = wizard && properties.showStepNav !== false;
  const onPick = (tab) => {
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
        <div className="flex h-[50px] items-center gap-2 px-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      ) : properties.hideTabs ? null : (
        <TabStrip
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
      <div className="relative min-h-0 w-full flex-1" style={{ background: look.panelBackground }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          shown.map((tab) =>
            properties.renderOnlyActiveTab && tab.id != currentTab ? null : (
              <TabPanel
                key={tab.id}
                id={id}
                tab={tab}
                width={width}
                active={tab.id == currentTab}
                dynamic={dynamic}
                background={look.panelBackground}
              />
            )
          )
        )}
      </div>
      {showNav && !isLoading ? (
        <div
          className="flex shrink-0 items-center justify-between gap-2 border-t px-3"
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
            <ChevronLeft className="mr-1 h-4 w-4" />
            {String(properties.backLabel || 'Back')}
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
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
            {isLastStep ? null : <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
