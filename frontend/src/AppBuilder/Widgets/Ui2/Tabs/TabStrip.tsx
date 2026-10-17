import React from 'react';
import type { KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { TablerIcon } from '@/AppBuilder/Widgets/Ui2/_shared/TablerIcon';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { Tab, TabId } from './tabsModel';

export type TabsVariant = 'pills' | 'underline' | 'steps';

const TabIcon = ({ tab }: { tab: Tab }) =>
  tab?.iconVisibility && tab?.icon ? (
    <TablerIcon iconName={String(tab.icon)} style={{ width: 16, height: 16 }} stroke={1.75} />
  ) : null;

/** A tab in the strip: selected by click, and a Tab stop only while selected (tabKeys moves between tabs). */
interface TabButtonProps {
  tab: Tab;
  active: boolean;
  disabled: boolean;
  onPick: (tab: Tab) => void;
  className: string;
  children: React.ReactNode;
}

const TabButton = ({ tab, active, disabled, onPick, className, children }: TabButtonProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    data-tab-id={tab.id}
    tabIndex={active ? 0 : -1}
    disabled={disabled}
    onClick={() => onPick(tab)}
    className={className}
  >
    {children}
  </button>
);

/** The WAI-ARIA tabs keyboard pattern on a tab strip: Left and Right arrows move to the previous or next enabled
 *  tab and select it, Home and End to the first and last. Only the selected tab is a Tab stop (tabIndex below). */
const tabKeys =
  (tabs: Tab[], currentTab: TabId | undefined, onPick: (tab: Tab) => void, canPick: (tab: Tab) => boolean) =>
  (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number | 'first' | 'last'> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: 'first',
      End: 'last',
    };
    const move = moves[event.key];
    if (move === undefined) return;
    const enabled = tabs.filter(canPick);
    if (!enabled.length) return;
    const at = enabled.findIndex((tab) => tab.id == currentTab); // eslint-disable-line eqeqeq
    const next =
      move === 'first'
        ? enabled[0]
        : move === 'last'
        ? enabled[enabled.length - 1]
        : enabled[(Math.max(at, 0) + move + enabled.length) % enabled.length];
    event.preventDefault();
    if (next.id != currentTab) onPick(next); // eslint-disable-line eqeqeq
    const strip = event.currentTarget;
    requestAnimationFrame(() =>
      strip.querySelector<HTMLElement>(`[data-tab-id="${String(next.id).replace(/["\\]/g, '\\$&')}"]`)?.focus()
    );
  };

const TAB_RING = 'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring';

/** The tab strip in one of the three styles. Stays 50px tall (the reflow's TABS_TAB_BAR_HEIGHT). */
interface TabStripProps {
  tabs: Tab[];
  currentTab: TabId | undefined;
  variant: TabsVariant;
  align: unknown;
  stepIndex: number;
  linear: boolean;
  onPick: (tab: Tab) => void;
}

export const TabStrip = ({ tabs, currentTab, variant, align, stepIndex, linear, onPick }: TabStripProps) => {
  const justify = align === 'center' ? 'tw-justify-center' : 'tw-justify-start';
  const stretch = align === 'stretch';
  const canPick = (tab: Tab) => !tab.disable && (variant !== 'steps' || !linear || tabs.indexOf(tab) <= stepIndex);
  const onKeyDown = tabKeys(tabs, currentTab, onPick, canPick);
  if (variant === 'steps') {
    return (
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className={cn('tw-flex tw-h-[50px] tw-items-center tw-gap-2 tw-px-3', justify)}
      >
        {tabs.map((tab, index) => {
          const done = index < stepIndex;
          const active = tab.id == currentTab;
          const reachable = !linear || index <= stepIndex;
          return (
            <React.Fragment key={tab.id}>
              {index > 0 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    'tw-h-px tw-min-w-[16px] tw-flex-1',
                    done || active ? 'tw-bg-ui2-primary' : 'tw-bg-ui2-border'
                  )}
                />
              ) : null}
              <TabButton
                tab={tab}
                active={active}
                disabled={!!tab.disable || !reachable}
                onPick={onPick}
                className={cn(
                  'tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-ui2-md tw-px-1.5 tw-py-1 tw-text-ui2-sm tw-transition-colors disabled:tw-cursor-not-allowed',
                  TAB_RING,
                  active
                    ? 'tw-font-semibold tw-text-[color:var(--tb-active-text,var(--sc-foreground))]'
                    : 'tw-text-[color:var(--tb-text,var(--sc-muted-foreground))]',
                  tab.disable && 'tw-opacity-50'
                )}
              >
                <span
                  className={cn(
                    'tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-text-xs tw-font-semibold tw-tabular-nums',
                    active && 'tw-border-ui2-primary tw-bg-ui2-primary tw-text-ui2-primary-foreground',
                    done && 'tw-border-ui2-primary tw-bg-ui2-primary/10 tw-text-ui2-primary',
                    !active && !done && 'tw-border-ui2-border tw-bg-ui2-background'
                  )}
                >
                  {done ? <Check className="tw-h-3.5 tw-w-3.5" /> : index + 1}
                </span>
                <span className="tw-max-w-[160px] tw-truncate">{String(tab.title ?? '')}</span>
              </TabButton>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  // Underline and pills tabs: the same button with the tab's icon and title, in each style's classes.
  const titledTabs = (classes: (active: boolean) => string) =>
    tabs.map((tab) => {
      const active = tab.id == currentTab;
      return (
        <TabButton
          key={tab.id}
          tab={tab}
          active={active}
          disabled={!!tab.disable}
          onPick={onPick}
          className={classes(active)}
        >
          <TabIcon tab={tab} />
          {String(tab.title ?? '')}
        </TabButton>
      );
    });
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className={cn(
          'tw-flex tw-h-[50px] tw-items-end tw-gap-1 tw-overflow-x-auto tw-overflow-y-hidden tw-border-b tw-px-3',
          justify
        )}
        style={{ borderColor: 'var(--tb-border, var(--sc-border))' }}
      >
        {titledTabs((active) =>
          cn(
            '-tw-mb-px tw-flex tw-h-10 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-t-ui2-sm tw-border-b-2 tw-px-3 tw-text-[length:var(--tb-font,0.875rem)] tw-font-medium tw-transition-colors disabled:tw-pointer-events-none disabled:tw-opacity-50',
            TAB_RING,
            stretch && 'tw-flex-1',
            active
              ? 'tw-border-[color:var(--tb-indicator,var(--sc-primary))] tw-text-[color:var(--tb-active-text,var(--sc-foreground))]'
              : 'tw-border-transparent tw-text-[color:var(--tb-text,var(--sc-muted-foreground))] hover:tw-text-[color:var(--tb-active-text,var(--sc-foreground))]'
          )
        )}
      </div>
    );
  }
  return (
    <div className={cn('tw-flex tw-h-[50px] tw-items-center tw-overflow-x-auto tw-overflow-y-hidden tw-px-3', justify)}>
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className={cn(
          'tw-inline-flex tw-h-9 tw-items-center tw-rounded-ui2-lg tw-bg-[color:var(--tb-list-bg,var(--sc-muted))] tw-p-1 tw-text-[color:var(--tb-text,var(--sc-muted-foreground))]',
          stretch && 'tw-flex tw-w-full'
        )}
      >
        {titledTabs((active) =>
          cn(
            'tw-inline-flex tw-h-7 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-ui2-md tw-px-3 tw-text-[length:var(--tb-font,0.875rem)] tw-font-medium tw-transition-all focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring disabled:tw-pointer-events-none disabled:tw-opacity-50',
            stretch && 'tw-flex-1',
            active &&
              'tw-bg-[color:var(--tb-active-bg,var(--sc-background))] tw-text-[color:var(--tb-active-text,var(--sc-foreground))] tw-shadow-sm'
          )
        )}
      </div>
    </div>
  );
};
