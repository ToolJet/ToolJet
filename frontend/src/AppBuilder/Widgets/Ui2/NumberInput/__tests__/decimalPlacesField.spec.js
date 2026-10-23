import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * Decimal places took any number ({{12}}) while the Number input silently rounded to at most 10 places (1.123456789012
 * became 1.123456789). Its inspector field now says the range under it and flags a number outside 0 to 10 (its
 * config's minValue and maxValue, which Code.jsx checks). The widget keeps its runtime bound.
 */
import { limitCheck, maxValueCheck } from '@/AppBuilder/RightSideBar/Inspector/Elements/maxValueCheck';
import { shadNumberInputConfig } from '@/AppBuilder/WidgetManager/widgets/shadNumberInput';
import { clampInt, roundTo } from '@/AppBuilder/Widgets/Ui2/_inputs/inputsModel';

const field = shadNumberInputConfig.properties.decimalPlaces;

test('Decimal places says its range and flags a number outside 0 to 10', () => {
  expect(field.note).toMatch(/0 to 10/);
  expect(field).toMatchObject({ minValue: 0, maxValue: 10 });
  const check = limitCheck(field);
  // A binding reaches the check resolved ({{12}} is 12).
  expect(check(12)).toEqual([false, '0 to 10; a larger number is taken as 10.']);
  expect(check(-1)).toEqual([false, '0 to 10; a smaller number is taken as 0.']);
  expect(check(0)).toEqual([true, null]);
  expect(check(10)).toEqual([true, null]);
  expect(check('')).toEqual([true, null]);
  // What the widget does with it.
  expect(clampInt(12, 0, 10, 2)).toBe(10);
  expect(roundTo(1.123456789012, 12)).toBe(1.123456789);
});

test('a check with only a maximum is unchanged (File upload Max files)', () => {
  const check = maxValueCheck(100);
  expect(check(-5)).toEqual([true, null]);
  expect(check(500)).toEqual([false, 'At most 100; a larger number is taken as 100.']);
  expect(limitCheck({})).toBeUndefined();
});
