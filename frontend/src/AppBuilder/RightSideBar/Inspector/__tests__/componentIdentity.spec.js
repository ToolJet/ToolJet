import { componentIdentity } from '../componentIdentity';

// The Properties tab opens with one line naming where a component comes from and what it is (design option D).
// Pack components build theirs from the pack (LibraryComponent/packIdentity); this covers the rest.
describe('componentIdentity', () => {
  test('a native widget names ToolJet UI 1.0 and its display name', () => {
    // Break this catches: a native widget shown by its type (TextInput) instead of the name the panel uses.
    expect(componentIdentity('TextInput', 'Text input')).toEqual({
      kind: 'native',
      library: 'ToolJet UI 1.0',
      component: 'Text input',
    });
  });

  test('a module instance names Modules and the module it shows', () => {
    // Break this catches: every module instance labelled just "Module", so two modules look alike.
    expect(componentIdentity('ModuleViewer', 'Module', 'Sales dashboard')).toEqual({
      kind: 'module',
      library: 'Modules',
      component: 'Sales dashboard',
    });
  });

  test("a module instance falls back to its widget name before the module's name loads", () => {
    // Break this catches: "Modules · undefined" while the modules list is still loading.
    expect(componentIdentity('ModuleViewer', 'Module', undefined)).toEqual({
      kind: 'module',
      library: 'Modules',
      component: 'Module',
    });
  });

  test.each([
    ['PackComponent', 'a pack component, which builds its own strip'],
    ['LibraryComponent', "a custom library's component, which keeps its Component and Revision rows"],
    ['ModuleContainer', "the module editor's own container"],
  ])('shows nothing for %s (%s)', (type) => {
    // Break this catches: two strips on a pack component, or a strip where the inspector shows something else.
    expect(componentIdentity(type, 'Anything')).toBeNull();
  });

  test('shows nothing when the widget has no display name', () => {
    // Break this catches: "ToolJet UI 1.0 · undefined" for a widget whose config lacks a display name.
    expect(componentIdentity('Mystery', undefined)).toBeNull();
  });
});
