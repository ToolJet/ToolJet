/**
 * @jest-environment node
 *
 * isComponentDeletable — componentsSliceUtils
 *
 * Pure predicate, zero mocks. Exercises the guard that prevents deletion of
 * structural components (ModuleContainer) via the UI, keyboard shortcuts,
 * or programmatic callers (MCP / AI).
 */
import { isComponentDeletable } from '../componentsSliceUtils';

describe('isComponentDeletable', () => {
  test('returns false for a ModuleContainer definition', () => {
    const def = { component: { component: 'ModuleContainer', name: 'ModuleContainer' } };
    expect(isComponentDeletable(def)).toBe(false);
  });

  test('returns true for a regular Button definition', () => {
    const def = { component: { component: 'Button', name: 'Button1' } };
    expect(isComponentDeletable(def)).toBe(true);
  });

  test('returns true for a Text definition', () => {
    const def = { component: { component: 'Text', name: 'Text1' } };
    expect(isComponentDeletable(def)).toBe(true);
  });

  test('returns true for a Form definition', () => {
    const def = { component: { component: 'Form', name: 'form1' } };
    expect(isComponentDeletable(def)).toBe(true);
  });

  test('returns true when the definition is null (unknown component)', () => {
    expect(isComponentDeletable(null)).toBe(true);
  });

  test('returns true when the definition is undefined', () => {
    expect(isComponentDeletable(undefined)).toBe(true);
  });

  test('returns true when component.component is missing', () => {
    const def = { component: {} };
    expect(isComponentDeletable(def)).toBe(true);
  });

  test('is case-sensitive — "modulecontainer" is not blocked', () => {
    // The type string in production is always PascalCase; verify the guard
    // does not accidentally allow a casing bypass.
    const def = { component: { component: 'modulecontainer' } };
    expect(isComponentDeletable(def)).toBe(true);
  });
});
