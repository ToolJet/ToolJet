import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * Every UI 2.0 chart that exposes clickedDataPoint has a Highlight clicked point toggle (off by default), and the
 * highlight helpers read a clicked datum as the charts hand it over.
 */
import { CONFIGS } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';
import { DIMMED, emphasis, highlightOf, sameDatum } from '../highlight';

const CLICKABLE = Object.keys(CONFIGS).filter((type) => CONFIGS[type].exposedVariables?.clickedDataPoint !== undefined);

test('the charts that expose clickedDataPoint', () => {
  expect(CLICKABLE.length).toBeGreaterThanOrEqual(10);
});

test.each(CLICKABLE)('%s has a Highlight clicked point toggle, off for a new chart', (type) => {
  expect(CONFIGS[type].properties.highlightClicked).toMatchObject({
    type: 'toggle',
    displayName: 'Highlight clicked point',
  });
  expect(CONFIGS[type].definition.properties.highlightClicked.value).toBe('{{false}}');
  expect(CONFIGS[type].actions.map((a) => a.handle)).toContain('clearClickedPoint');
});

test('a datum is highlighted by content; an empty clicked point highlights nothing', () => {
  expect(highlightOf({})).toBeNull();
  expect(highlightOf({ month: 'Aug' })).toEqual({ month: 'Aug' });
  expect(sameDatum({ month: 'Aug', v: 1 }, { month: 'Aug', v: 1 })).toBe(true);
  expect(sameDatum({ month: 'Jul' }, { month: 'Aug' })).toBe(false);
  expect(emphasis({ month: 'Jul' }, null)).toBe(1);
  expect(emphasis({ month: 'Jul' }, { month: 'Aug' })).toBe(DIMMED);
  expect(emphasis({ month: 'Aug' }, { month: 'Aug' })).toBe(1);
});
