import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Calendar. The pack's Calendar, the inline SDK and the host renderer
// are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

// What pack.css declares for a selector (one of a rule's selector list), as written: jsdom keeps var() as written.
const declared = (selector, property) => {
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  document.head.appendChild(style);
  const rule = [...style.sheet.cssRules].find((r) =>
    (r.selectorText ?? '').split(',').some((s) => s.trim() === selector)
  );
  style.remove();
  return rule?.style.getPropertyValue(property) ?? '';
};

const DATE = '.ant-picker-calendar.ant-picker-calendar-full';

// PKB-26: Border color did not reach the full calendar's day lines (the line over each day, Ant's split colour). It now
// draws them; today keeps its Primary line, and unset the lines keep Ant's colour.
// PKB-41: Primary color did not colour the picked day's line (only its tint). Set, it does; a calendar with no picked
// day (is-unpicked) draws no day as picked.
describe('Ant Design full Calendar day lines', () => {
  test('[PackComponent-CALENDAR-001] Border color draws every day’s line but today’s', () => {
    expect(
      declared(
        `.tj-ant-calendar ${DATE} .ant-picker-calendar-date:not(.ant-picker-calendar-date-today)`,
        'border-top-color'
      )
    ).toBe('var(--tj-ant-color-border, var(--ant-color-split))');
  });

  test('[PackComponent-CALENDAR-002] Primary color draws the picked day’s line, only on a picked calendar', () => {
    expect(
      declared(
        `.tj-ant-calendar:not(.is-unpicked) ${DATE} .ant-picker-cell-selected .ant-picker-calendar-date:not(.ant-picker-calendar-date-today)`,
        'border-top-color'
      )
    ).toBe('var(--tj-ant-color-primary, var(--tj-ant-color-border, var(--ant-color-split)))');
  });

  test('[PackComponent-CALENDAR-003] the rules reach a picked full calendar’s days', async () => {
    const v = await mountPack('antd', 'Calendar', { value: '2026-11-05' });

    expect(v.root().querySelector('.tj-ant-calendar:not(.is-unpicked)')).toBeTruthy();
    expect(v.root().querySelector(`${DATE} .ant-picker-cell-selected .ant-picker-calendar-date`)).toBeTruthy();
  });
});

// PF-074: QA saw a full calendar in a 200px box cut off with no scrollbar. On current main the Calendar fills its box
// and scrolls (verified live: the wheel scrolls it); this pins it.
describe('Ant Design Calendar in a short box', () => {
  test('[PackComponent-CALENDAR-004] the full calendar fills its box and scrolls', async () => {
    const v = await mountPack('antd', 'Calendar', {});
    const r = copyWithPackCss(v.root()).querySelector('.tj-ant-root');

    expect(getComputedStyle(r).height).toBe('100%');
    expect(getComputedStyle(r).overflow).toBe('auto');
  });
});
