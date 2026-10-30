/**
 * A pack or custom library component's Validation section (mandatory, min length...) writes into
 * definition.validation, as native inputs do. Their widget configs declared no `validation`, so the edit threw
 * twice: setComponentProperty read definition.validation[...] on a fresh drop, and debugger.validateProperty read
 * the config's validation[...] meta on every edit. The second throw came before the save, so the rule never
 * reached the server and the field was never validated.
 *
 * Nothing is mocked except the network save, which is what the tests observe.
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { seedApp } from '@/test/app-builder';

const state = () => useStore.getState();

// The definition a drop creates: the widget config's own definition, as appCanvasUtils copies it.
function droppedComponent(id, name, type) {
  return {
    id,
    name,
    component: {
      component: type,
      name,
      displayName: type,
      definition: structuredClone(componentTypeDefinitionMap[type].definition),
    },
    layouts: { desktop: { top: 0, left: 0, width: 8, height: 40 } },
  };
}

// The definition after a reload: the server returns every column, so validation is an empty object.
function reloadedComponent(id, name, type) {
  const component = droppedComponent(id, name, type);
  component.component.definition.validation = {};
  return component;
}

const savedDefinition = (saveComponentChanges, id) =>
  saveComponentChanges.mock.calls.at(-1)?.[0]?.[id]?.component?.definition;

describe.each(['PackComponent', 'LibraryComponent'])('%s Validation section', (type) => {
  let saveComponentChanges;

  beforeEach(() => {
    saveComponentChanges = jest.fn();
    useStore.setState({ saveComponentChanges });
    // The store starts in view mode, where nothing is saved; the Inspector only exists in the editor.
    state().setCurrentMode('edit');
  });

  test.each([
    ['a freshly dropped component', droppedComponent],
    ['a component loaded from the server', reloadedComponent],
  ])('saves mandatory on %s', (_label, build) => {
    seedApp({ c1: build('c1', 'input1', type) });

    expect(() => state().setComponentProperty('c1', 'mandatory', '{{true}}', 'validation')).not.toThrow();

    expect(savedDefinition(saveComponentChanges, 'c1')?.validation?.mandatory).toEqual({ value: '{{true}}' });
  });

  test('saves min length and resolves it for the running component', () => {
    seedApp({ c1: droppedComponent('c1', 'input1', type) });

    state().setComponentProperty('c1', 'minLength', '{{3}}', 'validation');

    expect(savedDefinition(saveComponentChanges, 'c1')?.validation?.minLength).toEqual({ value: '{{3}}' });
    expect(state().getResolvedComponent('c1')?.validation?.minLength).toBe(3);
  });
});
