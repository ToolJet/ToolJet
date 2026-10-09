import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

const FLASH_CLASS = 'tj-code-search-flash';
const FLASH_MS = 1500;
const EXACT_WAIT_MS = 600; // prefer the exact field; after this accept any editor containing the match
const TIMEOUT_MS = 2000;

const flash = (element) => {
  if (!element) return;
  element.classList.remove(FLASH_CLASS);
  void element.offsetWidth; // restart the animation when the same element flashes twice
  element.classList.add(FLASH_CLASS);
  setTimeout(() => element.classList.remove(FLASH_CLASS), FLASH_MS);
};

const panelSelectorFor = (entityType) => (entityType === 'query' ? '.query-manager' : '.editor-sidebar .inspector');

// The editor whose text equals the indexed field is the field itself (editors render
// replaceIdsWithName(initialValue), the same text the index holds). Otherwise fall back to the
// first editor that contains the match.
const findEditor = (panel, match, allowPartial) => {
  const editors = [...panel.querySelectorAll('.cm-editor')]
    .map((element) => ({ element, view: EditorView.findFromDOM(element) }))
    .filter(({ view }) => view);
  const exact = editors.find(({ view }) => view.state.doc.toString() === match.record.text);
  if (exact || !allowPartial) return exact;
  const needle = match.record.text.slice(match.start, match.end);
  return editors.find(({ view }) => view.state.doc.toString().includes(needle));
};

// ponytail: DOM-driven reveal (clicks Inspector tabs / accordion headers, matches field labels by
// text). Replace with searchKey + store-controlled Inspector tabs (spec §9) when precision matters.
const STYLE_SECTIONS = ['styles', 'generalStyles'];

// Component fields live under the Inspector's Properties or Styles tab; open the right one first.
const selectInspectorTab = (panel, record) => {
  if (record.entityType !== 'component') return;
  const tabName = STYLE_SECTIONS.includes(record.fieldPath[0]) ? 'Styles' : 'Properties';
  const tab = [...panel.querySelectorAll('[role="tab"]')].find((el) => el.textContent.trim() === tabName);
  if (tab && !tab.classList.contains('active')) tab.click();
};

const expandCollapsedAccordion = (element) => {
  const collapsed = element.closest('.accordion-collapse:not(.show)');
  collapsed?.parentElement?.querySelector(':scope > .accordion-header')?.click();
};

// Fields without a code editor (toggles, pickers, selects): find the row by its label text.
const findFieldRow = (panel, record) => {
  if (record.entityType !== 'component') return null;
  const label = record.fieldLabel.split(' › ')[1]?.toLowerCase();
  if (!label) return null;
  const labelElement = [...panel.querySelectorAll('.tab-pane.active label, .tab-pane.active span')].find(
    (el) => el.children.length === 0 && el.textContent.trim().toLowerCase() === label
  );
  return labelElement ? labelElement.closest('.code-flex-wrapper') || labelElement.parentElement : null;
};

const selectOccurrence = (view, match) => {
  const text = view.state.doc.toString();
  const needle = match.record.text.slice(match.start, match.end);
  // Exact editor: the indexed offsets are the editor offsets. Partial editor: first occurrence.
  const from = text === match.record.text ? match.start : text.indexOf(needle);
  if (from < 0) return;
  view.dispatch({ selection: EditorSelection.single(from, from + needle.length), scrollIntoView: true });
  view.focus();
};

const revealAndFlash = (element, afterScroll) => {
  expandCollapsedAccordion(element);
  // Let the accordion expand paint before scrolling to the field.
  requestAnimationFrame(() => {
    element.scrollIntoView({ block: 'center' });
    afterScroll?.();
    flash(element);
  });
};

// Waits for the opened panel to render, then selects and flashes the match: in its code editor
// when it has one, else the field row by label, else the whole panel.
export const highlightMatch = (match) => {
  const { record } = match;
  const started = performance.now();
  const tick = () => {
    const panel = document.querySelector(panelSelectorFor(record.ownerType || record.entityType));
    const elapsed = performance.now() - started;
    // Re-applied every frame: selecting a component re-renders the Inspector back to Properties.
    if (panel) selectInspectorTab(panel, record);
    const settled = elapsed > EXACT_WAIT_MS;
    const editor = panel && findEditor(panel, match, false);
    if (editor) return revealAndFlash(editor.element, () => selectOccurrence(editor.view, match));
    if (panel && settled) {
      const row = findFieldRow(panel, record);
      if (row) return revealAndFlash(row);
      const partial = findEditor(panel, match, true);
      if (partial) return revealAndFlash(partial.element, () => selectOccurrence(partial.view, match));
    }
    if (elapsed > TIMEOUT_MS) return flash(panel);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
