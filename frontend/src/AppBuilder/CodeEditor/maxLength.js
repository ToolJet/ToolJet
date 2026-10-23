import { EditorState } from '@codemirror/state';

/** A single-line field's longest plain value (a config's `maxLength`, e.g. the One-time code's one-character
 *  Placeholder): an edit that would make the text longer is refused, as an input's maxlength refuses it. A binding
 *  ({{...}}) is not limited: what it resolves to is read by the widget. */
export const maxLengthFilter = (max) =>
  EditorState.transactionFilter.of((tr) =>
    !tr.docChanged || tr.newDoc.length <= max || tr.newDoc.toString().includes('{{') ? tr : []
  );
