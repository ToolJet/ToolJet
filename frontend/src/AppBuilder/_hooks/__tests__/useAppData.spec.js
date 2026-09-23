import { isEmbeddedModuleInstance } from '../useAppData';

describe('isEmbeddedModuleInstance', () => {
  test('is true for a module embedded via ModuleViewer (mode=view, moduleMode=true)', () => {
    expect(isEmbeddedModuleInstance('view', true)).toBe(true);
  });

  test('is false for the top-level app/module viewer (mode=view, moduleMode=false)', () => {
    expect(isEmbeddedModuleInstance('view', false)).toBe(false);
  });

  test('is false for the module editor, which also sets moduleMode=true (mode=edit, moduleMode=true)', () => {
    expect(isEmbeddedModuleInstance('edit', true)).toBe(false);
  });

  test('is false for the app editor (mode=edit, moduleMode=false)', () => {
    expect(isEmbeddedModuleInstance('edit', false)).toBe(false);
  });
});
