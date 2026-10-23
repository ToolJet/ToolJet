import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { list, isRecord, text } from '../lib/ui2/nav/model';
import { lookVars, px } from '../lib/ui2/nav/look';
import { useTabs } from '../lib/ui2/nav/hooks';
import { Spinner, TabStrip } from '../lib/ui2/nav/parts';
import type { TabsVariant } from '../lib/ui2/nav/parts';
import { LoadingBox, useLoadingLook } from '../lib/ui2/loading/look';
import { TabStripSkel } from '../lib/ui2/loading/shapes';
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
  const [linearSteps] = ToolJet.useStateBoolean({ name: 'linearSteps', label: 'Steps in order only', initialValue: true });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onTabSwitch = ToolJet.useEventCallback({ name: 'onTabSwitch' });
  const { disabled } = ToolJet.useControlState();

  const accent = ToolJet.useStyleString({ name: 'accentColor', label: 'Accent (underline, active step)', inspector: 'color', initialValue: '' });
  const tabListBackground = ToolJet.useStyleString({ name: 'tabListBackground', label: 'Tab bar background', inspector: 'color', initialValue: '' });
  const tabTextColor = ToolJet.useStyleString({ name: 'tabTextColor', label: 'Tab text color', inspector: 'color', initialValue: '' });
  const activeTabTextColor = ToolJet.useStyleString({ name: 'activeTabTextColor', label: 'Active tab text color', inspector: 'color', initialValue: '' });
  const activeTabBackground = ToolJet.useStyleString({ name: 'activeTabBackground', label: 'Active tab background (pills)', inspector: 'color', initialValue: '' });
  const indicatorColor = ToolJet.useStyleString({ name: 'indicatorColor', label: 'Active tab indicator (underline)', inspector: 'color', initialValue: '' });
  const panelBackground = ToolJet.useStyleString({ name: 'panelBackground', label: 'Panel background', inspector: 'color', initialValue: '' });
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Panel text', inspector: 'color', initialValue: '' });
  const borderColor = ToolJet.useStyleString({ name: 'borderColor', label: 'Border color', inspector: 'color', initialValue: '' });
  const radius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Radius', initialValue: '' });
  const tabFontSize = ToolJet.useStyleNumber({ name: 'tabFontSize', label: 'Tab font size', initialValue: '' });
  const showBorder = ToolJet.useStyleBoolean({ name: 'showBorder', label: 'Border around tabs', initialValue: true });
  // The pack's earlier style names, still read when set.
  const listColor = ToolJet.useStyleString({ name: 'listBackground', label: 'Tab list (legacy)', inspector: 'color', initialValue: '' });
  const activeColor = ToolJet.useStyleString({ name: 'activeBackground', label: 'Active tab (legacy)', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
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
    onSwitched: () => {
      onChange();
      onTabSwitch();
    },
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
        />
      )}
      <div className="n2-tabs-body">
        <div className="n2-tabs-panels" style={panelBackground ? { background: panelBackground } : undefined}>
          {ld.loading ? (
            <LoadingBox />
          ) : t.tab ? (
            <div role="tabpanel" className={cn('n2-tab-panel is-text', t.tab.disable && 'is-disabled')}>
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
