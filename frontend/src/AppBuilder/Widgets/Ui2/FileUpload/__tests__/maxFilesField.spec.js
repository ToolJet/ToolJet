import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * Max files took any number (500) while the File upload silently drew at most 100. Its inspector field now says the
 * range under it and flags a larger number with a message (its config's maxValue, which Code.jsx checks).
 */
import { maxValueCheck } from '@/AppBuilder/RightSideBar/Inspector/Elements/maxValueCheck';
import { shadFileUploadConfig } from '@/AppBuilder/WidgetManager/widgets/shadFileUpload';
import { clampFiles } from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';

const field = shadFileUploadConfig.properties.maxFiles;

test('Max files says its range and flags a number past 100', () => {
  expect(field.note).toMatch(/1 to 100/);
  expect(field.maxValue).toBe(100);
  const check = maxValueCheck(field.maxValue);
  expect(check('500')).toEqual([false, 'At most 100; a larger number is taken as 100.']);
  expect(check(100)).toEqual([true, null]);
  expect(check('{{5}}')).toEqual([true, null]);
  // What the widget draws for it.
  expect(clampFiles(500)).toBe(100);
  // A field without a maxValue keeps the panel's or the schema's check.
  expect(maxValueCheck(undefined)).toBeUndefined();
});
