/**
 * A code editor's autocomplete opens in the document the editor renders into, so an editor portalled
 * into another browser tab shows it there instead of in the app tab.
 */
import { getTooltipExtension } from '@/AppBuilder/CodeEditor/codeEditorDocument';

test('keeps one stable extension per document', () => {
  const otherDocument = document.implementation.createHTMLDocument('');

  expect(getTooltipExtension(document)).toBe(getTooltipExtension(document));
  expect(getTooltipExtension(otherDocument)).not.toBe(getTooltipExtension(document));
});
