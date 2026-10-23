/**
 * The One-time code's Placeholder took any text though it shows one character per box (the first, repeated): its
 * inspector field now takes one character, as an input's maxlength does. A binding is not limited.
 */
import { EditorState } from '@codemirror/state';
import { maxLengthFilter } from '../maxLength';
import { shadOtpInputConfig } from '@/AppBuilder/WidgetManager/widgets/shadOtpInput';

const edit = (doc, insert) => {
  const state = EditorState.create({ doc, extensions: [maxLengthFilter(1)] });
  return state.update({ changes: { from: doc.length, insert } }).state.doc.toString();
};

test('a plain value stops at the field’s maximum; a binding does not', () => {
  expect(edit('', '•')).toBe('•');
  expect(edit('•', 'x')).toBe('•');
  expect(edit('', 'abc')).toBe('');
  expect(edit('', "{{'•'}}")).toBe("{{'•'}}");
});

test('the One-time code placeholder field takes one character, with a note', () => {
  expect(shadOtpInputConfig.properties.placeholder.maxLength).toBe(1);
  expect(shadOtpInputConfig.properties.placeholder.note).toMatch(/One character/);
});
