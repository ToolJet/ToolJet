import {
  activeItemExposed,
  aspectRatio,
  calendarExposed,
  calendarSelection,
  carouselPositions,
  carouselSlides,
  clampInt,
  clickedOption,
  disabledMatchers,
  findNav,
  groupButtons,
  iconName,
  initialSelection,
  markersByDay,
  menuRows,
  moveIndex,
  navItems,
  selectionExposed,
  toDate,
  toggleSelection,
  unwrap,
  visiblePeriod,
  ymd,
} from '../actionsModel';

const JUNK = [null, undefined, 42, 'text', true, {}, [], [null, 3, { label: {} }, [1]], { value: { a: 1 } }];

describe('actionsModel basics', () => {
  it("unwraps the inspector's { value } wrappers only", () => {
    expect(unwrap({ value: 'IconBolt' })).toBe('IconBolt');
    expect(unwrap({ value: 1, fxActive: false })).toBe(1);
    expect(unwrap({ value: 1, label: 'One' })).toEqual({ value: 1, label: 'One' });
    expect(iconName({ value: 'IconBolt' })).toBe('IconBolt');
    expect(iconName('bolt')).toBe('');
  });

  it('clamps whole numbers and falls back on junk', () => {
    expect(clampInt('7', 1, 3, 1)).toBe(3);
    expect(clampInt(-5, 1, 3, 2)).toBe(1);
    expect(clampInt('abc', 1, 3, 2)).toBe(2);
    expect(clampInt(Infinity, 1, 3, 2)).toBe(2);
  });
});

describe('menuRows', () => {
  it('builds items, group headings and separators, dropping hidden items and stray separators', () => {
    const rows = menuRows([
      { separator: true },
      { label: 'Edit', value: 'edit', icon: 'IconPencil', shortcut: '⌘E' },
      { label: 'Hidden', value: 'h', visible: false },
      { label: 'Copy', value: 'copy', disable: { value: true } },
      { label: 'Invite', value: 'invite', group: 'Team' },
      { label: 'Delete', value: 'delete', destructive: true, separator: true },
      { type: 'separator' },
    ]);
    expect(rows.map((r) => (r.kind === 'item' ? r.value : r.kind === 'label' ? `#${r.label}` : '--'))).toEqual([
      'edit',
      'copy',
      '--',
      '#Team',
      'invite',
      '--',
      'delete',
    ]);
    expect(rows[1].disabled).toBe(true);
    expect(rows[0]).toMatchObject({ icon: 'IconPencil', shortcut: '⌘E' });
  });

  it('accepts plain values and survives junk', () => {
    expect(menuRows(['A', 2]).map((r) => r.label)).toEqual(['A', '2']);
    JUNK.forEach((junk) => expect(() => menuRows(junk)).not.toThrow());
    expect(menuRows(Array.from({ length: 5000 }, (_, i) => i))).toHaveLength(200);
  });

  it('gives the native lastClickedOption shape', () => {
    expect(clickedOption({ label: 'A', value: 'a', description: 'd', icon: 'x' })).toEqual({
      label: 'A',
      value: 'a',
      description: 'd',
    });
  });
});

describe('button group selection', () => {
  const buttons = groupButtons([
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Dup', value: 'week' },
    { label: '', value: 'star', icon: 'IconStar' },
    { label: 'Gone', value: 'gone', visible: false },
  ]);

  it('normalises buttons uniquely by value, keeping icon-only buttons', () => {
    expect(buttons.map((b) => [b.label, b.value])).toEqual([
      ['Day', 'day'],
      ['Week', 'week'],
      ['', 'star'],
    ]);
  });

  it('reads the default selection per mode', () => {
    expect(initialSelection('week', 'single', buttons)).toEqual(['week']);
    expect(initialSelection(['day', 'nope', 'star'], 'multiple', buttons)).toEqual(['day', 'star']);
    expect(initialSelection(['day', 'star'], 'single', buttons)).toEqual(['day']);
    expect(initialSelection('week', 'actions', buttons)).toEqual([]);
    expect(initialSelection({ value: 'day' }, 'single', buttons)).toEqual(['day']);
  });

  it('toggles per mode', () => {
    expect(toggleSelection(['day'], 'week', 'single')).toEqual(['week']);
    expect(toggleSelection(['day'], 'day', 'single')).toEqual(['day']);
    expect(toggleSelection(['day'], 'day', 'single', true)).toEqual([]);
    expect(toggleSelection(['day'], 'week', 'multiple')).toEqual(['day', 'week']);
    expect(toggleSelection(['day', 'week'], 'day', 'multiple')).toEqual(['week']);
  });

  it('exposes value, values and the native selected', () => {
    const numbered = groupButtons([1, 2]);
    expect(selectionExposed(['2'], 'single', numbered)).toEqual({ value: 2, values: [2], selected: [2] });
    expect(selectionExposed([], 'multiple', numbered)).toEqual({ value: [], values: [], selected: [] });
  });
});

describe('navigation items', () => {
  const items = navItems([
    { label: 'Home', value: 'home', icon: 'IconHome', badge: 3 },
    { separator: true },
    { label: 'Reports', id: 'reports', children: [{ label: 'Sales', value: 'sales' }, 'Traffic', { label: 'Home' }] },
    { label: 'Hidden', value: 'hidden', visible: false },
    { label: 'Dup', value: 'home' },
    { separator: true },
  ]);

  it('normalises items, children and separators', () => {
    expect(items.map((i) => (i.separator ? '--' : i.key))).toEqual(['home', '--', 'reports']);
    expect(items[0].badge).toBe('3');
    expect(items[2].children.map((c) => c.key)).toEqual(['sales', 'Traffic', 'Home']);
  });

  it('finds an item and its parent', () => {
    const found = findNav(items, 'sales');
    expect(activeItemExposed(found)).toEqual({
      label: 'Sales',
      value: 'sales',
      parentLabel: 'Reports',
      parentValue: 'reports',
    });
    expect(findNav(items, 'nope')).toBeNull();
    expect(activeItemExposed(null)).toBeNull();
  });

  it('survives junk', () => {
    JUNK.forEach((junk) => expect(() => navItems(junk)).not.toThrow());
    expect(navItems([{ label: 'A', children: 'x' }])[0].children).toEqual([]);
  });
});

describe('calendar logic', () => {
  it('parses dates and selections per mode', () => {
    expect(ymd(toDate('2026-10-09'))).toBe('2026-10-09');
    expect(toDate('not a date')).toBeUndefined();
    expect(toDate({})).toBeUndefined();
    expect(ymd(calendarSelection('2026-10-09', 'single'))).toBe('2026-10-09');
    expect(calendarSelection(['2026-10-09', '2026-10-09', 'x', '2026-10-01'], 'multiple').map(ymd)).toEqual([
      '2026-10-09',
      '2026-10-01',
    ]);
    const range = calendarSelection(['2026-10-12', '2026-10-02'], 'range');
    expect([ymd(range.from), ymd(range.to)]).toEqual(['2026-10-02', '2026-10-12']);
    expect(calendarSelection({ start: '2026-10-01' }, 'range').to).toBeUndefined();
    JUNK.forEach((junk) => ['single', 'multiple', 'range'].forEach((m) => calendarSelection(junk, m)));
  });

  it('exposes values per mode', () => {
    expect(calendarExposed(toDate('2026-10-09'), 'single')).toMatchObject({
      value: '2026-10-09',
      selectedDates: ['2026-10-09'],
    });
    expect(calendarExposed(undefined, 'single').value).toBe('');
    expect(calendarExposed([toDate('2026-10-09'), toDate('2026-10-01')], 'multiple').value).toEqual([
      '2026-10-01',
      '2026-10-09',
    ]);
    expect(calendarExposed({ from: toDate('2026-10-01') }, 'range')).toMatchObject({
      value: ['2026-10-01', ''],
      startDate: '2026-10-01',
      endDate: '',
    });
  });

  it('gives the visible period across months', () => {
    expect(visiblePeriod(toDate('2026-10-15'), 2)).toEqual({
      visibleMonth: '2026-10',
      visibleStart: '2026-10-01',
      visibleEnd: '2026-11-30',
    });
  });

  it('groups markers by day and builds disabled matchers', () => {
    const map = markersByDay([
      { date: '2026-10-09', label: 'A', color: '#f00' },
      { date: '2026-10-09', label: 'B' },
      '2026-10-10',
      { date: 'junk' },
      null,
    ]);
    expect(map.get('2026-10-09')).toEqual([
      { label: 'A', color: '#f00' },
      { label: 'B', color: '' },
    ]);
    expect(map.get('2026-10-10')).toEqual([{ label: '', color: '' }]);
    const matchers = disabledMatchers({
      minDate: '2026-10-01',
      maxDate: '',
      disabledDates: ['2026-10-05', 'x'],
      disabledDays: [0, 'saturday', 9],
    });
    expect(matchers).toHaveLength(3);
    expect(matchers[2]).toEqual({ dayOfWeek: [0, 6] });
    expect(disabledMatchers({ disabledDates: 'x', disabledDays: null })).toEqual([]);
  });
});

describe('carousel logic', () => {
  it('normalises slides', () => {
    expect(
      carouselSlides(['a.jpg', { src: 'b.jpg', title: 'B' }, { title: 'Text only' }, { description: 'nothing' }, 3])
    ).toEqual([
      { image: 'a.jpg', title: '', description: '', link: '' },
      { image: 'b.jpg', title: 'B', description: '', link: '' },
      { image: '', title: 'Text only', description: '', link: '' },
    ]);
    JUNK.forEach((junk) => expect(() => carouselSlides(junk)).not.toThrow());
  });

  it('moves within the positions, wrapping when looping', () => {
    expect(carouselPositions(5, 1)).toBe(5);
    expect(carouselPositions(5, 3)).toBe(3);
    expect(carouselPositions(0, 1)).toBe(1);
    expect(moveIndex(5, 5, true)).toBe(0);
    expect(moveIndex(-1, 5, true)).toBe(4);
    expect(moveIndex(9, 5, false)).toBe(4);
    expect(moveIndex(NaN, 5, false)).toBe(0);
  });

  it('reads aspect ratios', () => {
    expect(aspectRatio('16/9')).toBeCloseTo(16 / 9);
    expect(aspectRatio('4:3')).toBeCloseTo(4 / 3);
    expect(aspectRatio('fill')).toBeNull();
    expect(aspectRatio(2)).toBe(2);
    expect(aspectRatio('junk')).toBeCloseTo(16 / 9);
  });
});
