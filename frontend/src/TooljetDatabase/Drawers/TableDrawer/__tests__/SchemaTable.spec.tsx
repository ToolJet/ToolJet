import React from 'react';
import { render, screen, userEvent, within } from '@/test/test-utils';
import { SchemaTable } from '../SchemaTable';
import { useTableDraft } from '../useTableDraft';

// A table draft with one added column, as the create drawer holds it.
function Harness() {
  const draft = useTableDraft([]);
  return (
    <>
      <button type="button" onClick={() => draft.addColumn()}>
        add
      </button>
      <SchemaTable draft={draft} />
    </>
  );
}

const addColumnNamed = async (name: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'add' }));
  const inputs = screen.getAllByLabelText('Column name');
  await userEvent.type(inputs[inputs.length - 1], name);
};

describe('SchemaTable | column name errors', () => {
  it('marks the input and lists the message under the rows, not inside the row', async () => {
    render(<Harness />);
    await addColumnNamed('abort');

    const input = screen.getAllByLabelText('Column name').pop() as HTMLElement;
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('abort: Column name cannot be a reserved keyword');
    // Outside every row, so the row keeps its height.
    screen.getAllByRole('row').forEach((row) => expect(within(row).queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows nothing for a valid name', async () => {
    render(<Harness />);
    await addColumnNamed('seen_at');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('Column name').pop()).not.toHaveAttribute('aria-invalid');
  });

  it('lists every invalid name, one line each', async () => {
    render(<Harness />);
    await addColumnNamed('abort');
    await addColumnNamed('add');

    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });
});
