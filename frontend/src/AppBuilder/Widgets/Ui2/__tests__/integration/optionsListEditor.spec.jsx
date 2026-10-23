/**
 * The options list editor, end to end for each UI 2.0 widget that opts in (type optionsList): an option added in the
 * inspector's list is written into the widget's options value, and the widget draws it and exposes it (in `options`,
 * or as its value once picked). The inspector field is the real one (renderElement, Code, the fx bridge) writing to
 * the real store, as the editor's paramUpdated does.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

// jsdom cannot drag, and react-beautiful-dnd warns about its own defaultProps under React 18.
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

const ID = 'field1';

/** The widget's options field in the inspector, drawn from and written to the store. */
const InspectorField = ({ type, param, write }) => {
  const definition = useStore((s) => s.getComponentDefinition(ID, MODULE_ID));
  if (!definition) return null;
  const meta = componentTypeDefinitionMap[type];
  const component = { id: ID, component: { ...meta, ...definition.component } };
  const paramUpdated = (p, attr, value, paramType) => write(ID, p.name, value, paramType, attr);
  return (
    <div data-testid="inspector">{renderElement(component, meta, paramUpdated, [], param, 'properties', {}, {})}</div>
  );
};

const openPicker = async (type) => {
  const trigger = document.querySelector(`[id^="shad-${ID}-"]`);
  if (type === 'ShadSelect') {
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false });
  } else {
    await act(async () => fireEvent.click(trigger));
  }
};

// [type, options param, the new option's label, its value, how the widget shows it]
const CASES = [
  ['ShadToggleGroup', 'options', 'Option 4', 'Option 4', 'pick'],
  ['ShadRadioGroup', 'options', 'Option 4', 'Option 4', 'exposed'],
  ['ShadSelect', 'options', 'Option 3', 3, 'popup'],
  ['ShadMultiselect', 'options', 'Option 6', 'Option 6', 'popup'],
  ['ShadCombobox', 'options', 'Option 7', 'Option 7', 'popup'],
  ['ShadButtonGroup', 'buttons', 'Option 4', 'Option 4', 'pick'],
];
const harnesses = Object.fromEntries(
  CASES.map(([componentType]) => [
    componentType,
    createWidgetHarness({ componentType, id: ID, handle: 'field1', preload: [componentType] }),
  ])
);

describe.each(CASES)('%s options list', (type, param, label, value, shows) => {
  const widget = harnesses[type];
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('an option added in the list is drawn and exposed by the widget', async () => {
    widget.render({ currentMode: 'view' });
    const before = useStore.getState().getComponentDefinition(ID, MODULE_ID).component.definition.properties[
      param
    ].value;
    render(<InspectorField type={type} param={param} write={widget.setComponentProperty} />);
    const inspector = within(screen.getByTestId('inspector'));
    await act(async () => fireEvent.click(inspector.getByText('Add new option')));

    const after = useStore.getState().getComponentDefinition(ID, MODULE_ID).component.definition.properties[
      param
    ].value;
    expect(after.startsWith(before.slice(0, -4))).toBe(true);
    expect(after).not.toBe(before);
    expect(inspector.getByText(label)).toBeInTheDocument();

    if (shows === 'pick') {
      const item = await waitFor(() => {
        const found = [...document.querySelectorAll('button')].find(
          (b) => b.textContent === label && !b.closest('[data-testid="inspector"]')
        );
        expect(found).toBeDefined();
        return found;
      });
      await act(async () => fireEvent.click(item));
      await waitFor(() => expect(widget.exposed().value).toBe(value));
      return;
    }
    await waitFor(() => expect(widget.exposed().options).toContainEqual({ label, value }));
    if (shows === 'popup') {
      await openPicker(type);
      expect(await screen.findByRole('option', { name: label })).toBeInTheDocument();
    } else {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
    }
  });
});
