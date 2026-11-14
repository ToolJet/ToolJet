import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/StringRenderer';

/**
 * [KeyValuePair-BUG-HTML-001] An editable string renderer must treat its value as plain text, never HTML.
 *
 * Prerequisite for the on-type validation fix (KeyValuePair-FIELDTYPE-013): the editable
 * contentEditable node currently populates itself via `dangerouslySetInnerHTML`, which parses
 * markup-like text (e.g. `<b>text here</b>`) as real HTML instead of literal characters — the
 * same bug already fixed on the Table widget's own hotfix branch (table_issue_fixes.md issue #15).
 */
test('[KeyValuePair-BUG-HTML-001] editable string renderer does not parse markup-like text as HTML', () => {
  render(<StringRenderer value="<b>text here</b>" isEditable isEditing setIsEditing={() => {}} />);

  const editable = document.querySelector('[contenteditable="true"]');
  expect(editable.querySelector('b')).toBeNull();
  expect(editable.textContent).toBe('<b>text here</b>');
});

/**
 * [BUG-STRING-EDIT-OBJECT-001] An object value must not crash the editable string cell.
 * The editor used to render `{value}` as a raw React child, which throws for plain objects.
 */
test('[BUG-STRING-EDIT-OBJECT-001] editable string renderer does not crash on an object value', () => {
  expect(() => render(<StringRenderer value={{ a: 1 }} isEditable isEditing setIsEditing={() => {}} />)).not.toThrow();

  const editable = document.querySelector('[contenteditable="true"]');
  expect(editable.textContent).toBe(String({ a: 1 }));
});

test('[BUG-STRING-EDIT-OBJECT-002] focusing and blurring an object-valued cell without editing does not commit', () => {
  const onChange = jest.fn();
  render(<StringRenderer value={{ a: 1 }} isEditable isEditing setIsEditing={() => {}} onChange={onChange} />);

  const editable = document.querySelector('[contenteditable="true"]');
  fireEvent.blur(editable);

  expect(onChange).not.toHaveBeenCalled();
});

/**
 * [BUG-STRING-EDIT-BOOLEAN-001] A boolean value must stay visible when the cell enters edit mode.
 * React renders nothing for `true`/`false` children, so the editor opened blank.
 */
test.each([true, false])('[BUG-STRING-EDIT-BOOLEAN-001] editable string renderer shows %s in edit mode', (value) => {
  render(<StringRenderer value={value} isEditable isEditing setIsEditing={() => {}} />);

  expect(document.querySelector('[contenteditable="true"]').textContent).toBe(String(value));
});

test('[BUG-STRING-EDIT-BOOLEAN-002] focusing and blurring a boolean-valued cell without editing does not commit', () => {
  const onChange = jest.fn();
  render(<StringRenderer value={true} isEditable isEditing setIsEditing={() => {}} onChange={onChange} />);

  fireEvent.blur(document.querySelector('[contenteditable="true"]'));

  expect(onChange).not.toHaveBeenCalled();
});
