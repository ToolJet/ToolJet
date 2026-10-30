import React from 'react';
import { render } from '@testing-library/react';
import { StringRenderer } from '../StringRenderer';

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
