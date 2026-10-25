import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { list, isRecord, text } from '../lib/ui2/nav/model';
import { lookVars, px } from '../lib/ui2/nav/look';
import { useTabs } from '../lib/ui2/nav/hooks';
import { Spinner, TabStrip, tabPartIds, useTabIdBase } from '../lib/ui2/nav/parts';
import type { TabsVariant } from '../lib/ui2/nav/parts';
import { LoadingBox, useLoadingLook } from '../lib/ui2/loading/look';
import { TabStripSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useDrawnNumber, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

// Tabs with text content (TabsContainer holds components). The strip, styles and actions are UI 2.0 Tabs'.
export const Tabs = () => {
  const [rawTabs] = ToolJet.useStateArray({
    name: 'tabs',
    label: 'Tabs',
    description: 'Array of { value, label, content, icon, badge, disable, visible, loading } objects.',
    initialValue: [
      { value: 'overview', label: 'Overview', content: 'Revenue is up 20% this quarter, driven by enterprise renewals.' },
      { value: 'analytics', label: 'Analytics', content: '12,234 active users this week (+18%).' },
      { value: 'reports', label: 'Reports', content: 'Three reports are scheduled for Friday.' },
    ],
  });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Current tab', initialValue: 'overview' });
  const [defaultTab] = ToolJet.useStateString({ name: 'defaultTab', label: 'Default tab', initialValue: '' });
  // UI 2.0's exposed name for the current tab.
  const [, setCurrentTab] = ToolJet.useStateString({ name: 'currentTab', initialValue: '', inspector: 'hidden' });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Style',
    enumDefinition: ['pills', 'underline', 'steps'],
    enumLabels: { pills: 'Pills', underline: 'Underline', steps: 'Steps' },
    initialValue: 'pills',
    inspector: 'switch',
    section: 'Appearance',
  });
  const [tabsAlign] = ToolJet.useStateEnumeration({
    name: 'tabsAlign',
    label: 'Tab alignment',
    enumDefinition: ['start', 'center', 'stretch'],
    enumLabels: { start: 'Start', center: 'Center', stretch: 'Stretch' },
    initialValue: 'start',
    inspector: 'switch',
    section: 'Appearance',
  });
  const [orientation] = ToolJet.useStateEnumeration({
    name: 'orientation',
    label: 'Orientation',
    enumDefinition: ['horizontal', 'vertical'],
    enumLabels: { horizontal: 'Top', vertical: 'Side' },
    initialValue: 'horizontal',
    inspector: 'switch',
    section: 'Appearance',
  });
  const [hideTabs] = ToolJet.useStateBoolean({ name: 'hideTabs', label: 'Hide tabs', initialValue: false });
  const [linearSteps] = ToolJet.useStateBoolean({
    name: 'linearSteps',
    label: 'Steps in order only',
    initialValue: true,
    visibleWhen: { key: 'variant', value: 'steps' },
  });
  // One event per switch, UI 2.0's name: the pack's earlier onChange fired alongside it.
  const onTabSwitch = ToolJet.useEventCallback({ name: 'onTabSwitch' });
  const { disabled } = ToolJet.useControlState();

  const accent = useThemeColor('accentColor', 'Accent (underline, active step)', TOKEN.brand);
  const tabListBackground = useThemeColor('tabListBackground', 'Tab bar background', TOKEN.muted);
  const tabTextColor = useThemeColor('tabTextColor', 'Tab text color', TOKEN.mutedText);
  const activeTabTextColor = useThemeColor('activeTabTextColor', 'Active tab text color', TOKEN.text);
  const activeTabBackground = useThemeColor('activeTabBackground', 'Active tab background (pills)', TOKEN.surface);
  const indicatorColor = useThemeColor('indicatorColor', 'Active tab indicator (underline)', TOKEN.brand);
  const panelBackground = useThemeColor('panelBackground', 'Panel background', TOKEN.surface);
  const textColor = useThemeColor('textColor', 'Panel text', TOKEN.text);
  const borderColor = useThemeColor('borderColor', 'Border color', TOKEN.border);
  const radius = useThemeRadius('borderRadius', 'Radius');
  const tabFontSize = useDrawnNumber('tabFontSize', 'Tab font size', 14);
  const showBorder = ToolJet.useStyleBoolean({ name: 'showBorder', label: 'Border around tabs', initialValue: true });
  // The pack's earlier style names, still read when set.
  const listColor = ToolJet.useStyleString({ name: 'listBackground', label: 'Tab list (legacy)', inspector: 'color', initialValue: '' });
  const activeColor = ToolJet.useStyleString({ name: 'activeBackground', label: 'Active tab (legacy)', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  const idBase = useTabIdBase(ToolJet.useFieldId());
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 14 });

  // Tabs keyed by value (or id); content by the same key.
  const contents = new Map(
    list(rawTabs)
      .filter(isRecord)
      .map((t, i) => [text(t.id ?? t.value) || String(i + 1), text(t.content)])
  );
  const t = useTabs({
    raw: list(rawTabs).map((tab) => (isRecord(tab) && tab.id === undefined && tab.value !== undefined ? { ...tab, id: tab.value } : tab)),
    fallbackLabel: 'Tab',
    current: value,
    setCurrent: setValue,
    defaultTab,
    setTabParam: 'value',
    onSwitched: onTabSwitch,
  });
  React.useEffect(() => setCurrentTab(t.active), [t.active, setCurrentTab]);
  // 'pill' is the pack's earlier name for pills.
  const style: TabsVariant = variant === 'underline' || variant === 'steps' ? variant : 'pills';
  const vertical = orientation === 'vertical' && style !== 'steps';
  const vars = lookVars([
    [accent, '--ui-primary'],
    [tabListBackground || listColor, '--tb-list-bg'],
    [tabTextColor, '--tb-text'],
    [activeTabTextColor, '--tb-active-text'],
    [activeTabBackground || activeColor, '--tb-active-bg'],
    [indicatorColor, '--tb-indicator'],
    [borderColor, '--tb-border'],
    [textColor, '--ui-fg'],
    [tabFontSize, '--tb-font', px],
  ]);

  return (
    <div
      className={cn('ui n2-tabs', vertical && 'is-vertical', showBorder === false && 'no-border')}
      style={{ ...vars, ...(radius === '' || radius == null ? {} : { borderRadius: px(radius) }) }}
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
          idBase={idBase}
        />
      )}
      <div className="n2-tabs-body">
        <div className="n2-tabs-panels" style={panelBackground ? { background: panelBackground } : undefined}>
          {ld.loading ? (
            <LoadingBox />
          ) : t.tab ? (
            <div
              role="tabpanel"
              id={tabPartIds(idBase, t.tab.id).panel}
              aria-labelledby={hideTabs ? undefined : tabPartIds(idBase, t.tab.id).tab}
              className={cn('n2-tab-panel is-text', t.tab.disable && 'is-disabled')}
            >
              {t.tab.loading ? (
                <div className="n2-tab-loading" aria-busy="true">
                  <Spinner />
                </div>
              ) : (
                contents.get(t.tab.id) ?? ''
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
