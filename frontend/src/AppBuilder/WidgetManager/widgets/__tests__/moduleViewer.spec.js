import { moduleViewerConfig } from '../moduleViewer';
import { containerConfig } from '../container';

// tj-ee#5167 specifies visibility / loading / disabled states on the dropped Module widget,
// with behaviour matching Container. Most of the wiring is generic — useExposeState registers
// the CSAs, WidgetWrapper and RenderWidget consume the exposed keys — so this config IS the
// feature's contract. If a key here regresses, the states silently stop working with no error.

const STATE_PROPERTIES = ['visibility', 'loadingState', 'disabledState'];

describe('moduleViewerConfig — Additional actions properties', () => {
  test.each(STATE_PROPERTIES)('%s is an fx/boolean toggle in the additionalActions section', (key) => {
    const property = moduleViewerConfig.properties[key];
    expect(property).toBeDefined();
    expect(property.type).toBe('toggle');
    expect(property.section).toBe('additionalActions');
    expect(property.validation.schema).toEqual({ type: 'boolean' });
  });

  test('display names follow the issue, not Container', () => {
    // #5167 asks for `Loading` and `Disabled`; container.js uses `Loading state` and `Disable`.
    expect(moduleViewerConfig.properties.loadingState.displayName).toBe('Loading');
    expect(moduleViewerConfig.properties.disabledState.displayName).toBe('Disabled');
    expect(moduleViewerConfig.properties.visibility.displayName).toBe('Visibility');
  });

  test('validation defaults are visible, not loading, not disabled', () => {
    expect(moduleViewerConfig.properties.visibility.validation.defaultValue).toBe(true);
    expect(moduleViewerConfig.properties.loadingState.validation.defaultValue).toBe(false);
    expect(moduleViewerConfig.properties.disabledState.validation.defaultValue).toBe(false);
  });

  test('the pre-existing Visibility property is retained', () => {
    // #5167's table writes "—" under Property for Visibility. That reads as "no NEW property
    // needed" — the toggle already ships, and removing it would break apps binding it.
    expect(moduleViewerConfig.properties.visibility).toBeDefined();
  });
});

describe('moduleViewerConfig — definition defaults', () => {
  // resolveProperties() only iterates keys present in the SAVED definition, so a key missing
  // here is never materialised from validation.defaultValue — it resolves to undefined and the
  // widget exposes undefined instead of a boolean. Newly dropped Modules depend on these;
  // already-saved ones are covered by BackfillStatesForModuleViewer.
  test.each([
    ['visibility', '{{true}}'],
    ['loadingState', '{{false}}'],
    ['disabledState', '{{false}}'],
  ])('definition.properties.%s defaults to %s', (key, value) => {
    expect(moduleViewerConfig.definition.properties[key]).toEqual({ value });
  });

  test('every additionalActions property has a matching definition default', () => {
    const additionalActions = Object.entries(moduleViewerConfig.properties)
      .filter(([, meta]) => meta.section === 'additionalActions')
      .map(([key]) => key);

    additionalActions.forEach((key) => {
      expect(moduleViewerConfig.definition.properties[key]).toBeDefined();
    });
  });
});

describe('moduleViewerConfig — exposed variables', () => {
  test('exposes the three state variables with boolean defaults', () => {
    expect(moduleViewerConfig.exposedVariables).toEqual({
      isVisible: true,
      isDisabled: false,
      isLoading: false,
    });
  });

  test('matches Container, which is the behavioural reference', () => {
    expect(moduleViewerConfig.exposedVariables).toEqual(containerConfig.exposedVariables);
  });
});

describe('moduleViewerConfig — component specific actions', () => {
  const byHandle = (handle) => moduleViewerConfig.actions.find((action) => action.handle === handle);

  test.each([
    ['setVisibility', 'Set visibility'],
    ['setDisable', 'Set disable'],
    ['setLoading', 'Set loading'],
  ])('%s is registered as "%s"', (handle, displayName) => {
    const action = byHandle(handle);
    expect(action).toBeDefined();
    expect(action.displayName).toBe(displayName);
  });

  test('exposes exactly the three actions #5167 asks for', () => {
    expect(moduleViewerConfig.actions.map((a) => a.handle).sort()).toEqual([
      'setDisable',
      'setLoading',
      'setVisibility',
    ]);
  });

  test.each(['setVisibility', 'setDisable', 'setLoading'])('%s takes a single boolean toggle param', (handle) => {
    expect(byHandle(handle).params).toEqual([
      { handle: 'value', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' },
    ]);
  });

  test('the CSA handles match Container so useExposeState registers matching setters', () => {
    // useExposeState registers setVisibility/setDisable/setLoading as exposed functions; the
    // action handle is looked up on the exposed bag by name, so a rename breaks the CSA.
    const moduleHandles = moduleViewerConfig.actions.map((a) => a.handle).sort();
    const containerHandles = containerConfig.actions.map((a) => a.handle).sort();
    expect(moduleHandles).toEqual(containerHandles);
  });

  test('param handles are uniformly `value`, diverging from container.js on purpose', () => {
    // container.js names setVisibility's param `disable` — a copy-paste artifact. Diverging is
    // safe only because no saved event definition references this widget's params yet. If this
    // assertion is ever relaxed, re-check that nothing keys off the param handle generically.
    expect(new Set(moduleViewerConfig.actions.flatMap((a) => a.params.map((p) => p.handle)))).toEqual(
      new Set(['value'])
    );
  });
});
