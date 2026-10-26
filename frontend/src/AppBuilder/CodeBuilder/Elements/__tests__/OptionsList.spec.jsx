import '@/test/consoleGuard';
/**
 * The UI 2.0 options field as a list (type optionsList): add, remove, drag to reorder, and per option its label,
 * value (with its type), disabled and default. Every change writes the whole list into the same options value as
 * {{[...]}}; opening the list writes nothing, so code read as a list and switched back is the code it was.
 */
import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { OptionsList, OptionsListFieldContext } from '../OptionsList';

// jsdom cannot drag: the list's onDragEnd is kept so a spec can drop a row where a drag would.
const dnd = { onDragEnd: null };
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }) => {
    dnd.onDragEnd = onDragEnd;
    return children;
  },
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

/** The field as the inspector holds it: the options code and the widget's other properties, both written back. */
const Field = ({ initial, defaultValue, meta, writes }) => {
  const [code, setCode] = useState(initial);
  const [properties, setProperties] = useState({ defaultValue: { value: defaultValue } });
  return (
    <OptionsListFieldContext.Provider
      value={{
        code,
        properties,
        setProperty: (name, value) => {
          writes.push([name, value]);
          setProperties((p) => ({ ...p, [name]: { value } }));
        },
      }}
    >
      <OptionsList
        meta={meta}
        cyLabel="options"
        onChange={(value) => {
          writes.push(['options', value]);
          setCode(value);
        }}
      />
      <button type="button" onClick={() => setCode("{{['From', 'Outside']}}")}>
        external change
      </button>
    </OptionsListFieldContext.Provider>
  );
};

const mount = (initial, { defaultValue = '', meta = { defaultParam: 'defaultValue' } } = {}) => {
  const writes = [];
  render(<Field initial={initial} defaultValue={defaultValue} meta={meta} writes={writes} />);
  const optionsWrites = () => writes.filter(([name]) => name === 'options').map(([, v]) => v);
  return { writes, optionsWrites, last: () => optionsWrites().at(-1) };
};

const labels = () =>
  [...document.querySelectorAll('[data-cy^="options-option-"]')]
    .filter((el) => /^options-option-\d+$/.test(el.getAttribute('data-cy')))
    .map((el) => el.firstChild.textContent);
const DETAILS = '[data-cy="options-option-details"]';
const details = () => within(document.querySelector(DETAILS));
/** Opens an option's popover (react-bootstrap positions it after the click) and returns queries inside it. */
const open = async (label) => {
  await act(async () => fireEvent.click(screen.getByText(label)));
  return details();
};
/** Closes the open popover with a click outside it, as an author does. */
const close = async () => {
  await act(async () => fireEvent.click(document.body));
  await waitFor(() => expect(document.querySelector(DETAILS)).toBeNull());
};
const add = () => fireEvent.click(document.querySelector('[data-cy="options-add-option"]'));
const remove = (index) => {
  const item = document.querySelector(`[data-cy="options-option-${index}"]`).closest('.list-group-item');
  fireEvent.mouseEnter(item);
  fireEvent.click(item.querySelector('.delete-icon-btn'));
};

describe('UI 2.0 options list', () => {
  test('draws the options in the code as rows, and writes nothing until one is changed', () => {
    const { writes } = mount("{{['All', 'Open', 'Closed']}}");
    expect(labels()).toEqual(['All', 'Open', 'Closed']);
    expect(writes).toEqual([]);
  });

  test('adds an option in the list form', () => {
    const plain = mount("{{['All', 'Open']}}");
    add();
    expect(plain.last()).toBe("{{['All', 'Open', 'Option 3']}}");
    expect(labels()).toEqual(['All', 'Open', 'Option 3']);
  });

  test('a numbered list gets the next number; an empty one starts with plain text', () => {
    const numbered = mount("{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}");
    add();
    expect(numbered.last()).toBe(
      "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }, { label: 'Option 3', value: 3 }]}}"
    );
  });

  test('an empty field starts a list', () => {
    const empty = mount('');
    expect(labels()).toEqual([]);
    add();
    expect(empty.last()).toBe("{{['Option 1']}}");
  });

  test('removes an option', () => {
    const { last } = mount("{{['All', 'Open', 'Closed']}}");
    remove(1);
    expect(last()).toBe("{{['All', 'Closed']}}");
    expect(labels()).toEqual(['All', 'Closed']);
  });

  test('a drop moves an option; a drop outside the list does nothing', () => {
    const { last, optionsWrites } = mount("{{[{ label: 'A', value: 'a' }, 'b', { label: 'C', value: 3 }]}}");
    act(() => dnd.onDragEnd({ source: { index: 0 }, destination: null }));
    expect(optionsWrites()).toEqual([]);
    act(() => dnd.onDragEnd({ source: { index: 0 }, destination: { index: 2 } }));
    expect(last()).toBe("{{['b', { label: 'C', value: 3 }, { label: 'A', value: 'a' }]}}");
    expect(labels()).toEqual(['b', 'C', 'A']);
  });

  test('edits a label and a value; a plain option follows its label until its value is set apart', async () => {
    const { last } = mount("{{['All', 'Open']}}");
    let pop = await open('Open');
    fireEvent.change(pop.getByLabelText('Option label'), { target: { value: 'Pending' } });
    expect(last()).toBe("{{['All', 'Pending']}}");
    pop = details();
    fireEvent.change(pop.getByLabelText('Option value'), { target: { value: 'pending' } });
    expect(last()).toBe("{{['All', { label: 'Pending', value: 'pending' }]}}");
    fireEvent.change(pop.getByLabelText('Option label'), { target: { value: 'Waiting' } });
    expect(last()).toBe("{{['All', { label: 'Waiting', value: 'pending' }]}}");
  });

  test('values keep their type: numbers stay numbers and 0 and false survive', async () => {
    const { last } = mount("{{[{ label: 'None', value: 0 }, { label: 'No', value: false }]}}");
    let pop = await open('None');
    expect(pop.getByLabelText('Value type')).toHaveValue('number');
    fireEvent.change(pop.getByLabelText('Option label'), { target: { value: 'Zero' } });
    expect(last()).toBe("{{[{ label: 'Zero', value: 0 }, { label: 'No', value: false }]}}");
    fireEvent.change(pop.getByLabelText('Option value'), { target: { value: '' } });
    expect(last()).toBe("{{[{ label: 'Zero', value: 0 }, { label: 'No', value: false }]}}");
    fireEvent.change(pop.getByLabelText('Option value'), { target: { value: '10' } });
    expect(last()).toBe("{{[{ label: 'Zero', value: 10 }, { label: 'No', value: false }]}}");
    fireEvent.change(pop.getByLabelText('Value type'), { target: { value: 'string' } });
    expect(last()).toBe("{{[{ label: 'Zero', value: '10' }, { label: 'No', value: false }]}}");

    await close();
    pop = await open('No');
    expect(pop.getByLabelText('Value type')).toHaveValue('boolean');
    expect(pop.getByLabelText('Option value')).toHaveValue('false');
    fireEvent.change(pop.getByLabelText('Option value'), { target: { value: 'true' } });
    expect(last()).toBe("{{[{ label: 'Zero', value: '10' }, { label: 'No', value: true }]}}");
  });

  test('disables an option under the key it already uses', async () => {
    const { last } = mount("{{[{ label: 'Draft', value: 'draft' }, { label: 'Live', value: 'live', disable: true }]}}");
    let pop = await open('Draft');
    fireEvent.click(pop.getByLabelText('Disabled'));
    expect(last()).toBe(
      "{{[{ label: 'Draft', value: 'draft', disabled: true }, { label: 'Live', value: 'live', disable: true }]}}"
    );
    await close();
    pop = await open('Live');
    expect(pop.getByLabelText('Disabled')).toBeChecked();
    fireEvent.click(pop.getByLabelText('Disabled'));
    expect(last()).toBe("{{[{ label: 'Draft', value: 'draft', disabled: true }, { label: 'Live', value: 'live' }]}}");
  });

  test("marks the default in the widget's default value, keeping its type", async () => {
    const { writes } = mount("{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}", { defaultValue: '{{1}}' });
    let pop = await open('One');
    expect(pop.getByLabelText('Default option')).toBeChecked();
    await close();
    pop = await open('Two');
    expect(pop.getByLabelText('Default option')).not.toBeChecked();
    fireEvent.click(pop.getByLabelText('Default option'));
    expect(writes.at(-1)).toEqual(['defaultValue', '{{2}}']);
    fireEvent.click(pop.getByLabelText('Default option'));
    expect(writes.at(-1)).toEqual(['defaultValue', '']);
  });

  test('a multiselect marks several defaults', async () => {
    const { writes } = mount("{{['design', 'sales', 'support']}}", {
      defaultValue: "{{['design']}}",
      meta: { defaultParam: 'defaultValue', multipleDefaults: true },
    });
    const pop = await open('support');
    expect(pop.getByLabelText('Selected by default')).not.toBeChecked();
    fireEvent.click(pop.getByLabelText('Selected by default'));
    expect(writes.at(-1)).toEqual(['defaultValue', "{{['design', 'support']}}"]);
  });

  test('a default set by code cannot be changed from the list', async () => {
    mount("{{['a', 'b']}}", { defaultValue: '{{components.other.value}}' });
    expect((await open('a')).getByLabelText('Default option')).toBeDisabled();
  });

  test('a widget without a default property shows no default toggle', async () => {
    mount("{{['a', 'b']}}", { meta: {} });
    expect((await open('a')).queryByLabelText('Default option')).toBeNull();
  });

  test('a change from outside (code, an undo) is read again', () => {
    mount("{{['a', 'b']}}");
    fireEvent.click(screen.getByText('external change'));
    expect(labels()).toEqual(['From', 'Outside']);
  });
});
