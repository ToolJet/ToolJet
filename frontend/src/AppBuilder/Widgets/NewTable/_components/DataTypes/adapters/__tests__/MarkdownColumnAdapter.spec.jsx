import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MarkdownColumn } from '../MarkdownColumnAdapter';

const renderMarkdownColumn = () => {
  const { container } = render(
    <MarkdownColumn
      id="table1"
      isEditable={true}
      darkMode={false}
      handleCellValueChange={jest.fn()}
      textColor={undefined}
      cellValue="hello"
      column={{ key: 'col1' }}
      containerWidth={200}
      cell={{ row: { index: 0, original: {} } }}
      horizontalAlignment="left"
      cellSize="condensed"
    />
  );

  return container.querySelector('[contenteditable="true"]');
};

describe('MarkdownColumn editing', () => {
  it('does not throw when an editable cell is focused', () => {
    const editableCell = renderMarkdownColumn();

    expect(() => fireEvent.focus(editableCell)).not.toThrow();
  });
});
