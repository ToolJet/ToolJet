/**
 * Regression for the select/multiselect option editor (`OptionsList`) shared by the
 * KeyValuePair field-settings panel and the Table column-settings panel:
 *
 * 1. Two options could be given the same "Option value", which makes the stored value
 *    ambiguous. The edit is kept as typed (nothing is silently reverted) but every option
 *    sharing the value shows an inline error, and the debugger gets a component error.
 * 2. Editing an option's label remounted its list row (the row was keyed by the label),
 *    which closed the option's settings popover mid-edit.
 */
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useStore from '@/AppBuilder/_stores/store';
import { OptionsList } from '../../OptionsList';

// CodeMirror needs real layout APIs jsdom lacks; a plain input keeps the onChange contract.
jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <input
    data-testid={`code-hinter-${props.componentName}`}
    defaultValue={props.initialValue}
    onChange={(e) => props.onChange(e.target.value)}
  />
));

const buildField = () => ({
  name: 'status',
  key: 'status',
  fieldType: 'select',
  columnType: 'select',
  options: [
    { label: 'Option 1', value: 'Option 1' },
    { label: 'Option 2', value: 'Option 2' },
    { label: 'Option 3', value: 'Option 3' },
  ],
});

/** Mirrors how the Inspector feeds OptionsList: it mutates the field in place and reports via paramUpdated. */
function Host({ field, paramUpdated }) {
  const [, setTick] = useState(0);
  const props = {
    component: { component: { definition: { properties: { fields: { value: [field] } } } } },
    paramUpdated: (...args) => {
      paramUpdated(...args);
      setTick((t) => t + 1);
    },
  };
  return (
    <OptionsList
      column={field}
      props={props}
      index={0}
      darkMode={false}
      currentState={{}}
      getPopoverFieldSource={(columnType, name) => name}
      setColumnPopoverRootCloseBlocker={jest.fn()}
      component={{ id: 'kvp1', component: { name: 'keyvaluepair1' } }}
      onColumnItemChange={jest.fn()}
      paramToUpdate="fields"
    />
  );
}

const openOptionSettings = async (name) => {
  await userEvent.click(screen.getByText(name));
  return {
    labelInput: await screen.findByTestId('code-hinter-options::label'),
    valueInput: await screen.findByTestId('code-hinter-options::value'),
  };
};

const ERROR_TEXT = /option value must be unique/i;
const duplicateValueLogs = () =>
  useStore.getState().debugger.logs.filter((log) => log.logLevel === 'error' && /duplicate/i.test(log.message));

describe('OptionsList (KeyValuePair select / multiselect option editor)', () => {
  beforeEach(() => {
    useStore.getState().debugger.clear();
  });

  it('keeps a duplicated option value, shows a field error and logs a debugger error', async () => {
    const field = buildField();
    const paramUpdated = jest.fn();
    render(<Host field={field} paramUpdated={paramUpdated} />);

    const { valueInput } = await openOptionSettings('Option 2');
    fireEvent.change(valueInput, { target: { value: 'Option 1' } });

    expect(field.options.map((o) => o.value)).toEqual(['Option 1', 'Option 1', 'Option 3']);
    expect(paramUpdated).toHaveBeenCalled();
    expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();

    const logs = duplicateValueLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      type: 'component',
      componentId: 'kvp1',
      errorTarget: 'Component Property',
      key: 'keyvaluepair1 - Option value',
    });
    expect(logs[0].message).toContain('Option 1');
  });

  it('names the other options sharing the value, by label, in the field error and the debugger error', async () => {
    const field = buildField();
    field.options = [
      { label: 'Apple', value: 'a' },
      { label: 'Banana', value: 'b' },
      { label: 'Cherry', value: 'c' },
      { label: 'Date', value: 'd' },
    ];
    render(<Host field={field} paramUpdated={jest.fn()} />);

    const { valueInput } = await openOptionSettings('Banana');
    fireEvent.change(valueInput, { target: { value: 'a' } });
    fireEvent.change(valueInput, { target: { value: 'c' } });

    expect(screen.getByText(ERROR_TEXT)).toHaveTextContent('Cherry');
    expect(screen.getByText(ERROR_TEXT)).not.toHaveTextContent('Apple');
    expect(screen.getByText(ERROR_TEXT)).not.toHaveTextContent('Date');

    const [latest, first] = duplicateValueLogs();
    expect(first.message).toContain('Apple');
    expect(latest.message).toContain('Cherry');
    expect(latest.message).toContain('Banana');
  });

  it('lists every other option that shares the value', async () => {
    const field = buildField();
    field.options = [
      { label: 'Apple', value: 'x' },
      { label: 'Banana', value: 'x' },
      { label: 'Cherry', value: 'x' },
    ];
    render(<Host field={field} paramUpdated={jest.fn()} />);

    await openOptionSettings('Banana');

    expect(screen.getByText(ERROR_TEXT)).toHaveTextContent('Apple');
    expect(screen.getByText(ERROR_TEXT)).toHaveTextContent('Cherry');
    expect(screen.getByText(ERROR_TEXT)).not.toHaveTextContent('Banana');
  });

  it('clears the field error once the value is unique again, without logging again', async () => {
    const field = buildField();
    render(<Host field={field} paramUpdated={jest.fn()} />);

    const { valueInput } = await openOptionSettings('Option 2');
    fireEvent.change(valueInput, { target: { value: 'Option 1' } });
    fireEvent.change(valueInput, { target: { value: 'two' } });

    expect(field.options.map((o) => o.value)).toEqual(['Option 1', 'two', 'Option 3']);
    expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
    expect(duplicateValueLogs()).toHaveLength(1);
  });

  it('shows the field error on the other option that shares the value too', async () => {
    const field = buildField();
    field.options[1].value = 'Option 1';
    render(<Host field={field} paramUpdated={jest.fn()} />);

    await openOptionSettings('Option 1');

    expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();
  });

  it('shows no field error for options with distinct values', async () => {
    render(<Host field={buildField()} paramUpdated={jest.fn()} />);

    await openOptionSettings('Option 3');

    expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
  });

  it('keeps the option settings popover open while the option label is edited', async () => {
    const field = buildField();
    render(<Host field={field} paramUpdated={jest.fn()} />);

    const { labelInput } = await openOptionSettings('Option 2');
    fireEvent.change(labelInput, { target: { value: 'Renamed' } });

    expect(field.options[1].label).toBe('Renamed');
    expect(screen.getByTestId('code-hinter-options::value')).toBeInTheDocument();
  });

  it('keeps the option settings popover open when two options share a label', async () => {
    const field = buildField();
    render(<Host field={field} paramUpdated={jest.fn()} />);

    const { labelInput } = await openOptionSettings('Option 2');
    fireEvent.change(labelInput, { target: { value: 'Option 1' } });

    expect(field.options.map((o) => o.label)).toEqual(['Option 1', 'Option 1', 'Option 3']);
    expect(screen.getByTestId('code-hinter-options::value')).toBeInTheDocument();
  });
});
