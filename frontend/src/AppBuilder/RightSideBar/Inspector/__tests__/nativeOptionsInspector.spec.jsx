/**
 * The native Dropdown, Multiselect and Radio button inspector (Components/Select.jsx) draws its options as a list:
 * add, remove, drag to reorder, and a popover per option with its label, value, caption (Dropdown, Multiselect),
 * default, visibility and disable. The list part is shared with the UI 2.0 options editor (shared/OptionsListEditor),
 * and these specs pin what the native inspector saves and draws, so that sharing changes neither.
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('../EventManager', () => ({ EventManager: () => null }));
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({ items }) => (
  <div>
    {items.map((item) => (
      <section key={item.title} data-title={item.title}>
        {item.children}
      </section>
    ))}
  </div>
));
// The fields' editors (CodeMirror) are not what this spec is about: a text box for a plain field, a button that turns
// a toggle field on for an fx one.
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: ({ type, placeholder, paramLabel, initialValue, onChange }) =>
    type === 'basic' ? (
      <input aria-label={placeholder} defaultValue={initialValue ?? ''} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <button type="button" data-initial={String(initialValue)} onClick={() => onChange('{{true}}')}>
        {paramLabel}
      </button>
    ),
}));
// jsdom cannot drag: the list's onDragEnd is kept so a spec can drop a row where a drag would.
const dnd = { onDragEnd: null };
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }) => {
    dnd.onDragEnd = onDragEnd;
    return children;
  },
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children, draggableId }) =>
    children({ innerRef: () => {}, draggableProps: { 'data-draggable-id': draggableId }, dragHandleProps: {} }, {}),
}));

import { Select } from '../Components/Select';

const OPTIONS = () => [
  {
    label: 'Alpha',
    value: 'a',
    visible: { value: '{{true}}' },
    disable: { value: '{{false}}' },
    default: { value: '{{false}}' },
  },
  {
    label: 'Beta',
    value: 'b',
    visible: { value: '{{true}}' },
    disable: { value: '{{false}}' },
    default: { value: '{{false}}' },
  },
  {
    label: 'Gamma',
    value: 'c',
    visible: { value: '{{true}}' },
    disable: { value: '{{false}}' },
    default: { value: '{{false}}' },
  },
];

const mount = (type, properties = {}) => {
  const seeded = componentDefinition('w1', 'widget1', type, { options: { value: OPTIONS() }, ...properties });
  seedApp({ w1: seeded });
  const meta = componentTypeDefinitionMap[type];
  const component = { id: 'w1', component: { ...seeded.component, properties: meta.properties } };
  const paramUpdated = jest.fn();
  const utils = render(
    <Select
      componentMeta={meta}
      darkMode={false}
      component={component}
      paramUpdated={paramUpdated}
      layoutPropertyChanged={jest.fn()}
      dataQueries={[]}
      currentState={{}}
      eventsChanged={jest.fn()}
      apps={[]}
      allComponents={{}}
      pages={[]}
    />
  );
  const optionsWrites = () => paramUpdated.mock.calls.filter(([param]) => param.name === 'options');
  const lastOptions = () => optionsWrites().at(-1)?.[2];
  return { ...utils, paramUpdated, optionsWrites, lastOptions };
};

const rows = () => [...document.querySelectorAll('[data-draggable-id]')];
const rowLabels = () => rows().map((row) => row.textContent);

describe.each(['DropdownV2', 'MultiselectV2', 'RadioButtonV2'])('native %s options inspector', (type) => {
  const hasCaption = type !== 'RadioButtonV2';

  test('draws one row per option, keyed by its value, with the add button under them', () => {
    const { optionsWrites } = mount(type);
    expect(rowLabels()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(rows().map((row) => row.getAttribute('data-draggable-id'))).toEqual(['a', 'b', 'c']);
    expect(rows()[0].querySelector('.list-group-item')).not.toBeNull();
    expect(document.querySelector('[data-cy="add-new-dropdown-option"]')).toHaveTextContent('Add new option');
    // Mounting writes the options back once, as it always has (sorted by the sort setting).
    expect(optionsWrites()).toHaveLength(1);
  });

  test('Add new option appends the native option shape', () => {
    const { lastOptions } = mount(type);
    fireEvent.click(document.querySelector('[data-cy="add-new-dropdown-option"]'));
    const added = lastOptions().at(-1);
    expect(added).toEqual({
      value: '4',
      label: 'option4',
      ...(hasCaption ? { caption: null } : {}),
      visible: { value: '{{true}}' },
      disable: { value: '{{false}}' },
      default: { value: '{{false}}' },
    });
    expect(lastOptions().map((o) => o.label)).toEqual(['Alpha', 'Beta', 'Gamma', 'option4']);
    expect(rowLabels()).toEqual(['Alpha', 'Beta', 'Gamma', 'option4']);
  });

  test('the delete button shows on hover and removes the option, flagged as a dropdown options change', () => {
    const { paramUpdated, lastOptions } = mount(type);
    const item = rows()[1].querySelector('.list-group-item');
    expect(item.querySelector('.delete-icon-btn')).toBeNull();
    fireEvent.mouseEnter(item);
    fireEvent.click(item.querySelector('.delete-icon-btn'));
    expect(lastOptions().map((o) => o.value)).toEqual(['a', 'c']);
    expect(paramUpdated).toHaveBeenLastCalledWith(
      { name: 'options' },
      'value',
      expect.any(Array),
      'properties',
      false,
      {
        isParamFromDropdownOptions: true,
      }
    );
    expect(rowLabels()).toEqual(['Alpha', 'Gamma']);
  });

  test('dropping a row moves the option', () => {
    const { lastOptions } = mount(type);
    act(() => dnd.onDragEnd({ source: { index: 0 }, destination: { index: 2 } }));
    expect(lastOptions().map((o) => o.value)).toEqual(['b', 'c', 'a']);
    expect(rowLabels()).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  test('a drop outside the list, or on the same place, changes nothing', () => {
    const { optionsWrites } = mount(type);
    act(() => dnd.onDragEnd({ source: { index: 0 }, destination: null }));
    act(() => dnd.onDragEnd({ source: { index: 1 }, destination: { index: 1 } }));
    expect(optionsWrites()).toHaveLength(1);
  });

  test('a row opens its popover with label, value, caption and the three toggles', () => {
    const { lastOptions } = mount(type);
    fireEvent.click(screen.getByText('Beta'));
    const popover = document.querySelector('.inspector-select-options-popover');
    expect(popover).not.toBeNull();
    expect(popover.style.minWidth).toBe('248px');
    const box = within(popover);
    expect(box.getByLabelText('Option label')).toHaveValue('Beta');
    expect(box.getByLabelText('Option value')).toHaveValue('b');
    expect(box.queryByLabelText('Optional description') !== null).toBe(hasCaption);
    expect(box.getByText('Make this default option')).toBeInTheDocument();
    expect(box.getByText('Visibility')).toBeInTheDocument();
    expect(box.getByText('Disable')).toBeInTheDocument();

    fireEvent.change(box.getByLabelText('Option label'), { target: { value: 'Bravo' } });
    expect(lastOptions()[1]).toMatchObject({ label: 'Bravo', value: 'b' });
    fireEvent.change(box.getByLabelText('Option value'), { target: { value: 'bb' } });
    expect(lastOptions()[1]).toMatchObject({ label: 'Bravo', value: 'bb' });
    // A row is keyed by its value: a new value draws the row again, and its popover closes.
    expect(document.querySelector('.inspector-select-options-popover')).toBeNull();
    fireEvent.click(screen.getByText('Bravo'));
    const open = () => within(document.querySelector('.inspector-select-options-popover'));
    fireEvent.click(open().getByText('Disable'));
    expect(lastOptions()[1].disable).toEqual({ value: '{{true}}' });
    fireEvent.click(open().getByText('Visibility'));
    expect(lastOptions()[1].visible).toEqual({ value: '{{true}}' });
  });

  test('Make this default option marks the option the native way', () => {
    const { paramUpdated, lastOptions } = mount(type);
    fireEvent.click(screen.getByText('Gamma'));
    fireEvent.click(screen.getByText('Make this default option'));
    if (type === 'MultiselectV2') {
      expect(paramUpdated).toHaveBeenLastCalledWith(
        { name: 'values' },
        'value',
        expect.arrayContaining(['c']),
        'properties'
      );
    } else {
      expect(lastOptions().map((o) => o.default.value)).toEqual(['{{false}}', '{{false}}', '{{true}}']);
    }
  });
});

describe('native options inspector, sorted', () => {
  test('a Dropdown sorted a-z keeps its options sorted and a drop turns sorting off', () => {
    const { paramUpdated, lastOptions } = mount('DropdownV2', { sort: { value: 'desc' } });
    expect(rowLabels()).toEqual(['Gamma', 'Beta', 'Alpha']);
    act(() => dnd.onDragEnd({ source: { index: 0 }, destination: { index: 2 } }));
    expect(lastOptions().map((o) => o.label)).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(paramUpdated).toHaveBeenCalledWith({ name: 'sort' }, 'value', 'none', 'properties');
  });

  test('dynamic options show the schema field instead of the list', () => {
    mount('DropdownV2', { advanced: { value: '{{true}}' } });
    expect(rows()).toHaveLength(0);
    expect(document.querySelector('[data-cy="add-new-dropdown-option"]')).toBeNull();
  });
});
