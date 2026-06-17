/**
 * @jest-environment node
 */
// Heavy/irrelevant imports for the path under test — stub them so the test stays isolated.
jest.mock('@/AppBuilder/WidgetManager', () => ({ componentTypeDefinitionMap: {} }));
jest.mock('@/AppBuilder/_utils/component-properties-validation', () => ({
  validate: jest.fn(() => [true, [], undefined]),
  generateSchemaFromValidationDefinition: jest.fn(),
  validateProperties: jest.fn(),
}));

import { createDebuggerSlice } from '@/AppBuilder/_stores/slices/debuggerSlice';

describe('debuggerSlice.validateProperty', () => {
  const makeSlice = (getComponentDefinition) => {
    const get = () => ({
      getComponentDefinition,
      getCurrentPageId: () => 'page-1',
      debugger: { log: jest.fn() },
    });
    return createDebuggerSlice(jest.fn(), get);
  };

  // Regression: on clone -> editor open the dependency graph still holds entries keyed by the
  // PREVIOUS app's component ids. A dependency cascade (setResolvedGlobals) calls validateProperty
  // with a stale id; getComponentDefinition returns undefined; the old code did
  // `componentDefinition.component.name` and threw, blanking the editor.
  it('returns the value unchanged (no throw) when the component is not in the current app', () => {
    const slice = makeSlice(() => undefined);
    const value = { resolved: 'foo' };

    expect(() =>
      slice.debugger.validateProperty('stale-component-id', 'properties', 'text', value, 'canvas')
    ).not.toThrow();
    expect(slice.debugger.validateProperty('stale-component-id', 'properties', 'text', value, 'canvas')).toBe(value);
  });
});
