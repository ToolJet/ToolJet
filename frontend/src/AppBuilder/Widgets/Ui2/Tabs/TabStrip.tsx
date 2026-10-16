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

const TAB_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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
  const justify = align === 'center' ? 'justify-center' : 'justify-start';
  const stretch = align === 'stretch';
  const canPick = (tab: Tab) => !tab.disable && (variant !== 'steps' || !linear || tabs.indexOf(tab) <= stepIndex);
  const onKeyDown = tabKeys(tabs, currentTab, onPick, canPick);
  if (variant === 'steps') {
    return (
      <div role="tablist" onKeyDown={onKeyDown} className={cn('flex h-[50px] items-center gap-2 px-3', justify)}>
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
                data-tab-id={tab.id}
                tabIndex={active ? 0 : -1}
                disabled={!!tab.disable || !reachable}
                onClick={() => onPick(tab)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors disabled:cursor-not-allowed',
                  TAB_RING,
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
        onKeyDown={onKeyDown}
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
              data-tab-id={tab.id}
              tabIndex={active ? 0 : -1}
              disabled={!!tab.disable}
              onClick={() => onPick(tab)}
              className={cn(
                '-mb-px flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-sm border-b-2 px-3 text-[length:var(--tb-font,0.875rem)] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
                TAB_RING,
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
        onKeyDown={onKeyDown}
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
              data-tab-id={tab.id}
              tabIndex={active ? 0 : -1}
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
