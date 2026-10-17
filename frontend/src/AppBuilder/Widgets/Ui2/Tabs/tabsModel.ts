// ToolJet UI 2.0 Tabs: the tab list and the look, kept apart from the component so they are tested on
// their own.

import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isSet, px } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A tab's id: its own id, else its index in the list. */
export type TabId = string | number;

/** A tab as the widget uses it, from the static list or the dynamic option. */
export interface Tab {
  id: TabId;
  title: string;
  disable: boolean;
  visible: boolean;
  loading: boolean;
  icon: unknown;
  iconVisibility: boolean;
}

// The inspector stores a static tab's fields as { value }; dynamic tabs carry plain values.
const unwrap = (field: unknown): unknown =>
  field !== null && typeof field === 'object' && 'value' in field ? field.value : field;
const truthy = (field: unknown): boolean => {
  const value = unwrap(field);
  return value === true || value === 'true' || value === '{{true}}';
};
const titleOf = (title: unknown): string => {
  const value = unwrap(title);
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? stringify(value) : String(value);
};

/** The tabs from the static list (tabItems) or the dynamic option (tabs), normalised; junk entries are dropped. */
export const tabsFromProperties = (properties: Resolved = {}): Tab[] => {
  const dynamic = truthy(properties.useDynamicOptions);
  const source = dynamic ? properties.tabs : properties.tabItems;
  if (!Array.isArray(source)) return [];
  return source
    .map((tab, index): Tab | null => {
      if (!tab || typeof tab !== 'object') return null;
      const id = isSet(tab.id) ? tab.id : index;
      const visible = unwrap(tab.visible);
      return {
        id,
        title: titleOf(tab.title),
        disable: truthy(tab.disable),
        visible: visible === undefined ? true : visible !== false && visible !== 'false',
        loading: truthy(tab.loading),
        icon: unwrap(tab.icon),
        iconVisibility: truthy(tab.iconVisibility),
      };
    })
    .filter((tab): tab is Tab => tab !== null);
};

export const visibleTabs = (tabs: Tab[] = []): Tab[] => tabs.filter((tab) => tab.visible !== false);

/** The next (step 1) or previous (step -1) visible, enabled tab from `currentId`; null at either end. */
export const neighbourTab = (tabs: Tab[], currentId: unknown, step: number): Tab | null => {
  const shown = visibleTabs(tabs);
  let index = shown.findIndex((tab) => tab.id == currentId);
  if (index < 0) return null;
  for (index += step; index >= 0 && index < shown.length; index += step) {
    if (!shown[index].disable) return shown[index];
  }
  return null;
};

const VARIABLES: [string, string, ((value: unknown) => string)?][] = [
  ['accentColor', '--sc-primary'],
  ['tabListBackground', '--tb-list-bg'],
  ['tabTextColor', '--tb-text'],
  ['activeTabTextColor', '--tb-active-text'],
  ['activeTabBackground', '--tb-active-bg'],
  ['indicatorColor', '--tb-indicator'],
  ['borderColor', '--tb-border'],
  ['tabFontSize', '--tb-font', px],
];

/** Styles as CSS: colours as variables the tab classes read, the frame inline. Each falls back to the app theme. */
export const tabsLook = (styles: Resolved = {}) => {
  const border = isSet(styles.borderColor) ? styles.borderColor : 'var(--sc-border)';
  return {
    vars: Object.fromEntries(
      VARIABLES.filter(([key]) => isSet(styles[key])).map(([key, name, toCss = String]) => [name, toCss(styles[key])])
    ),
    container: {
      // The frame is the widget's root, which its border classes do not reach (they style descendants): an outline
      // inset by its width draws it.
      outline: styles.showBorder === false ? 'none' : `1px solid ${border}`,
      outlineOffset: '-1px',
      borderRadius: isSet(styles.borderRadius) ? px(styles.borderRadius) : 'calc(var(--sc-radius) + 4px)',
      background: 'var(--sc-card)',
    },
    panelBackground: isSet(styles.panelBackground) ? styles.panelBackground : 'transparent',
  };
};

/** The DOM ids that tie a tab to its panel (aria-controls, aria-labelledby): a tab id may hold any text, so whitespace
 *  becomes _. Distinct from the panel canvas's own id (`<widget>-<tab>`). */
export const tabIds = (widgetId: string, tabId: unknown) => {
  const safe = String(tabId).replace(/\s/g, '_');
  return { tab: `${widgetId}-tab-${safe}`, panel: `${widgetId}-panel-${safe}` };
};
