import React from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { iconFor } from '../../icons';
import { cn } from '../../cn';
import type { MenuEntry, MenuRow, Tab } from './model';

// UI 2.0's shared parts of the navigation widgets (Ui2/_actions/actionParts, Ui2/Tabs/TabStrip), drawn with the
// n2-* classes of ui2-nav.css.

/** A lucide or Tabler icon by name (IconPencil, pencil); nothing for an unknown name. */
export const Icon = ({ name, size = 16, className }: { name: string; size?: number; className?: string }) => {
  const Glyph = name ? iconFor(name) : null;
  return Glyph ? (
    <span className={cn('n2-icon', className)} aria-hidden="true">
      <Glyph size={size} strokeWidth={1.75} />
    </span>
  ) : null;
};

export const Spinner = ({ className }: { className?: string }) => <span className={cn('n2-spinner', className)} aria-hidden="true" />;

// ---- Menu rows ---------------------------------------------------------------------------------------------------

export const MenuSeparator = () => <Menu.Separator className="n2-menu-sep" />;
export const MenuLabel = ({ children }: { children?: React.ReactNode }) => <Menu.Label className="n2-menu-label">{children}</Menu.Label>;

type RowItem = Pick<MenuEntry, 'label' | 'value' | 'icon' | 'description' | 'disabled'> & Partial<Pick<MenuEntry, 'shortcut' | 'destructive'>>;
export type RowOf<T extends RowItem> = ({ kind: 'item' } & T) | { kind: 'label'; label: string } | { kind: 'separator' };

/** A React key per row that follows the item, not its position, so a refresh that moves rows keeps focus on the
 *  same item. */
const rowKeys = (rows: RowOf<RowItem>[]) => {
  const seen = new Map<string, number>();
  return rows.map((row, i) => {
    if (row.kind !== 'item') return `${row.kind}${i}`;
    const id = row.value === '' ? `label:${row.label}` : `${typeof row.value}:${String(row.value)}`;
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    return `${id}#${n}`;
  });
};

/** The rows of a menu: items (icon, label, description, shortcut), group headings and separators. */
export const MenuRows = <T extends RowItem>({
  rows,
  onPick,
  activeKey,
}: {
  rows: RowOf<T>[];
  onPick: (item: { kind: 'item' } & T) => void;
  /** The value (as text) of the item to mark as current. */
  activeKey?: string;
}) => {
  if (!rows.length) return <div className="n2-menu-empty">No options</div>;
  const keys = rowKeys(rows as RowOf<RowItem>[]);
  return (
    <>
      {rows.map((row, i) => {
        if (row.kind === 'separator') return <MenuSeparator key={keys[i]} />;
        if (row.kind === 'label') return <MenuLabel key={keys[i]}>{row.label}</MenuLabel>;
        const active = activeKey !== undefined && String(row.value) === activeKey;
        return (
          <Menu.Item
            key={keys[i]}
            disabled={row.disabled}
            onSelect={() => onPick(row)}
            className={cn('n2-menu-item', row.description && 'has-description', row.destructive && 'is-destructive', active && 'is-active')}
          >
            {row.icon ? <Icon name={row.icon} className="n2-menu-icon" /> : null}
            <span className="n2-menu-text">
              <span className="n2-truncate">{row.label}</span>
              {row.description ? <span className="n2-menu-desc">{row.description}</span> : null}
            </span>
            {row.shortcut ? <span className="n2-menu-shortcut">{row.shortcut}</span> : null}
            {active ? <Check size={16} className="n2-menu-check" /> : null}
          </Menu.Item>
        );
      })}
    </>
  );
};

export type { MenuRow };

// ---- Tab strip ---------------------------------------------------------------------------------------------------

export type TabsVariant = 'pills' | 'underline' | 'steps';

interface TabStripProps {
  tabs: Tab[];
  current: string;
  variant: TabsVariant;
  align: string;
  vertical: boolean;
  stepIndex: number;
  linear: boolean;
  disabled: boolean;
  onPick: (tab: Tab) => void;
  /** Prefix of the tab and panel ids (tabPartIds), unique to the widget. */
  idBase?: string;
}

/** The ids that tie a tab to its panel (aria-controls, aria-labelledby). The base is the widget's own id, so two Tabs
 *  never share one; a tab id is encoded, as ids in an IDREF list cannot hold spaces. */
export const tabPartIds = (base: string, tabId: string) => {
  const key = encodeURIComponent(tabId);
  return { tab: `${base}-tab-${key}`, panel: `${base}-panel-${key}` };
};

/** The widget's id base for tabPartIds: the host's field id, or a React id under a host without one. */
export const useTabIdBase = (fieldId: string | undefined) => {
  const own = React.useId();
  return fieldId || `tabs${own.replace(/:/g, '')}`;
};

const TabFace = ({ tab }: { tab: Tab }) => (
  <>
    {tab.icon ? <Icon name={tab.icon} /> : null}
    <span className="n2-truncate">{tab.title}</span>
    {tab.badge ? <span className="n2-tab-badge">{tab.badge}</span> : null}
  </>
);

/** The tab strip in UI 2.0's three styles, with the WAI-ARIA keyboard pattern: arrows move to the previous or next
 *  enabled tab and select it, Home and End to the first and last; only one tab is a Tab stop. */
export const TabStrip = ({ tabs, current, variant, align, vertical, stepIndex, linear, disabled, onPick, idBase }: TabStripProps) => {
  const canPick = (tab: Tab) => !disabled && !tab.disable && (variant !== 'steps' || !linear || tabs.indexOf(tab) <= stepIndex);
  const stop = tabs.find((t) => t.id === current && canPick(t)) ?? tabs.find(canPick);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number | 'first' | 'last'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };
    const move = moves[event.key];
    if (move === undefined) return;
    const enabled = tabs.filter(canPick);
    if (!enabled.length) return;
    const at = enabled.findIndex((t) => t.id === current);
    const next =
      move === 'first' ? enabled[0] : move === 'last' ? enabled[enabled.length - 1] : enabled[(Math.max(at, 0) + move + enabled.length) % enabled.length];
    event.preventDefault();
    if (next.id !== current) onPick(next);
    const strip = event.currentTarget;
    requestAnimationFrame(() =>
      Array.from(strip.querySelectorAll<HTMLElement>('[role="tab"]'))
        .find((el) => el.dataset.tabId === next.id)
        ?.focus()
    );
  };
  const button = (tab: Tab, className: string, children: React.ReactNode, isDisabled = !!tab.disable) => {
    const active = tab.id === current;
    const ids = idBase ? tabPartIds(idBase, tab.id) : undefined;
    return (
      <button
        key={tab.id}
        type="button"
        role="tab"
        id={ids?.tab}
        aria-controls={ids?.panel}
        aria-selected={active}
        data-tab-id={tab.id}
        data-state={active ? 'active' : 'inactive'}
        tabIndex={tab === stop ? 0 : -1}
        disabled={isDisabled}
        onClick={() => !disabled && onPick(tab)}
        className={className}
      >
        {children}
      </button>
    );
  };
  const orient = vertical ? 'is-vertical' : 'is-horizontal';
  const alignClass = `is-align-${['center', 'stretch'].includes(align) ? align : 'start'}`;

  if (variant === 'steps') {
    return (
      <div role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'} onKeyDown={onKeyDown} className={cn('n2-tabstrip n2-tabstrip--steps', orient, alignClass)}>
        {tabs.map((tab, index) => {
          const done = index < stepIndex;
          const active = tab.id === current;
          const reachable = !linear || index <= stepIndex;
          return (
            <React.Fragment key={tab.id}>
              {index > 0 ? <div aria-hidden="true" className={cn('n2-step-line', (done || active) && 'is-on')} /> : null}
              {button(
                tab,
                cn('n2-step-tab', active && 'is-active', tab.disable && 'is-disabled'),
                <>
                  <span className={cn('n2-step-num', active && 'is-active', done && 'is-done')}>{done ? <Check size={14} /> : index + 1}</span>
                  <span className="n2-truncate n2-step-title">{tab.title}</span>
                  {tab.badge ? <span className="n2-tab-badge">{tab.badge}</span> : null}
                </>,
                !!tab.disable || !reachable
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  if (variant === 'underline') {
    return (
      <div role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'} onKeyDown={onKeyDown} className={cn('n2-tabstrip n2-tabstrip--underline', orient, alignClass)}>
        {tabs.map((tab) => button(tab, cn('n2-tab n2-tab--underline', tab.id === current && 'is-active'), <TabFace tab={tab} />))}
      </div>
    );
  }
  return (
    <div className={cn('n2-tabstrip n2-tabstrip--pills', orient, alignClass)}>
      <div role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'} onKeyDown={onKeyDown} className="n2-pill-list">
        {tabs.map((tab) => button(tab, cn('n2-tab n2-tab--pill', tab.id === current && 'is-active'), <TabFace tab={tab} />))}
      </div>
    </div>
  );
};
