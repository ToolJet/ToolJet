import { neighbourTab, tabsFromProperties, tabsLook, visibleTabs } from '../tabsModel';

describe('tabsFromProperties', () => {
  it('reads the static tab list, unwrapping { value } fields the inspector stores', () => {
    const tabs = tabsFromProperties({
      useDynamicOptions: false,
      tabItems: [
        { id: 't0', title: 'One', disable: { value: true }, visible: { value: true }, loading: false },
        { id: 't1', title: 'Two', visible: { value: false } },
      ],
    });
    expect(tabs).toEqual([
      { id: 't0', title: 'One', disable: true, visible: true, loading: false, icon: undefined, iconVisibility: false },
      {
        id: 't1',
        title: 'Two',
        disable: false,
        visible: false,
        loading: false,
        icon: undefined,
        iconVisibility: false,
      },
    ]);
  });

  it('reads dynamic tabs and gives a tab without an id its index', () => {
    const tabs = tabsFromProperties({ useDynamicOptions: true, tabs: [{ title: 'A' }, { id: 'b', title: 'B' }] });
    expect(tabs.map((t) => t.id)).toEqual([0, 'b']);
  });

  it('survives junk: not an array, null entries, non-string titles', () => {
    expect(tabsFromProperties({ useDynamicOptions: true, tabs: 'nope' })).toEqual([]);
    expect(tabsFromProperties({ useDynamicOptions: false, tabItems: null })).toEqual([]);
    const tabs = tabsFromProperties({ useDynamicOptions: true, tabs: [null, { id: 1, title: { a: 1 } }] });
    expect(tabs).toHaveLength(1);
    expect(typeof tabs[0].title).toBe('string');
  });
});

describe('visibleTabs and neighbourTab', () => {
  const tabs = [
    { id: 'a', visible: true },
    { id: 'b', visible: false },
    { id: 'c', visible: true, disable: true },
    { id: 'd', visible: true },
  ];
  it('skips hidden tabs', () => {
    expect(visibleTabs(tabs).map((t) => t.id)).toEqual(['a', 'c', 'd']);
  });
  it('steps to the next or previous visible, enabled tab and stops at the ends', () => {
    expect(neighbourTab(tabs, 'a', 1).id).toBe('d');
    expect(neighbourTab(tabs, 'd', -1).id).toBe('a');
    expect(neighbourTab(tabs, 'd', 1)).toBeNull();
    expect(neighbourTab(tabs, 'a', -1)).toBeNull();
  });
});

describe('tabsLook', () => {
  it('is the theme with nothing set', () => {
    const look = tabsLook({});
    expect(look.vars).toEqual({});
    expect(look.container.border).toBe('1px solid var(--sc-border)');
  });
  it('maps colours to variables and draws no border when turned off', () => {
    const look = tabsLook({
      accentColor: '#0f766e',
      tabTextColor: '#64748b',
      borderRadius: 12,
      showBorder: false,
      tabFontSize: 13,
    });
    expect(look.vars).toMatchObject({ '--sc-primary': '#0f766e', '--tb-text': '#64748b', '--tb-font': '13px' });
    expect(look.container.border).toBe('none');
    expect(look.container.borderRadius).toBe('12px');
  });
});
