// shadcn/ui pack Tabs (experiment): the tab list and the look, kept apart from the component so they are tested on
// their own.

const isSet = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const px = (value) => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : String(value));
// The inspector stores a static tab's fields as { value }; dynamic tabs carry plain values.
const unwrap = (field) => (field !== null && typeof field === 'object' && 'value' in field ? field.value : field);
const truthy = (field) => {
  const value = unwrap(field);
  return value === true || value === 'true' || value === '{{true}}';
};
const titleOf = (title) => {
  const value = unwrap(title);
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

/** The tabs from the static list (tabItems) or the dynamic option (tabs), normalised; junk entries are dropped. */
export const tabsFromProperties = (properties = {}) => {
  const dynamic = truthy(properties.useDynamicOptions);
  const source = dynamic ? properties.tabs : properties.tabItems;
  if (!Array.isArray(source)) return [];
  return source
    .map((tab, index) => {
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
    .filter(Boolean);
};

export const visibleTabs = (tabs = []) => tabs.filter((tab) => tab.visible !== false);

/** The next (step 1) or previous (step -1) visible, enabled tab from `currentId`; null at either end. */
export const neighbourTab = (tabs, currentId, step) => {
  const shown = visibleTabs(tabs);
  let index = shown.findIndex((tab) => tab.id == currentId);
  if (index < 0) return null;
  for (index += step; index >= 0 && index < shown.length; index += step) {
    if (!shown[index].disable) return shown[index];
  }
  return null;
};

const VARIABLES = [
  ['accentColor', '--sc-primary'],
  ['tabListBackground', '--tb-list-bg'],
  ['tabTextColor', '--tb-text'],
  ['activeTabTextColor', '--tb-active-text'],
  ['activeTabBackground', '--tb-active-bg'],
  ['indicatorColor', '--tb-indicator'],
  ['borderColor', '--tb-border'],
  ['tabFontSize', '--tb-font', px],
];

/** Styles as CSS: colours as variables the tab classes read (the pack's utilities are !important), the frame
 *  inline. Each falls back to the app theme. */
export const tabsLook = (styles = {}) => {
  const border = isSet(styles.borderColor) ? styles.borderColor : 'var(--sc-border)';
  return {
    vars: Object.fromEntries(
      VARIABLES.filter(([key]) => isSet(styles[key])).map(([key, name, toCss = String]) => [name, toCss(styles[key])])
    ),
    container: {
      border: styles.showBorder === false ? 'none' : `1px solid ${border}`,
      borderRadius: isSet(styles.borderRadius) ? px(styles.borderRadius) : 'calc(var(--sc-radius) + 4px)',
      background: 'var(--sc-card)',
    },
    panelBackground: isSet(styles.panelBackground) ? styles.panelBackground : 'transparent',
  };
};
