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

// Pages are edited in their details popover; libraries and the preloaded script in the Libraries
// panel; components and page settings in the right sidebar.
const PANEL_SELECTORS = { query: '.query-manager', page: '#add-new-page-popup' };
const LIBRARY_FIELDS = new Set(['preloadedScript', 'libraries']);
const panelSelectorFor = (record) => {
  const ownerType = record.ownerType || record.entityType;
  if (ownerType === 'app' && LIBRARY_FIELDS.has(record.fieldPath[0])) return '.app-libraries-panel';
  return PANEL_SELECTORS[ownerType] || '.editor-sidebar .inspector';
};

// ponytail: editors are matched by text, not by field key; give CodeHinter a searchKey (spec §9) if two
// fields with identical text on one panel ever pick the wrong one.
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

const STYLE_SECTIONS = ['styles', 'generalStyles'];

// Component fields and app-wide page settings both live under Properties / Styles tabs.
const hasInspectorTabs = (record) =>
  record.ownerType === 'component' || record.entityType === 'component' || record.entityId === 'pageSettings';

// Tabs are matched by their untranslated key (`data-tab-key`), never by label text.
const tabKeyFor = (record) => {
  if (!hasInspectorTabs(record)) return null;
  return record.entityType !== 'event' && STYLE_SECTIONS.includes(record.fieldPath[0]) ? 'styles' : 'properties';
};

// Open the tab the field lives under before looking for it.
const selectTab = (panel, record) => {
  const key = tabKeyFor(record);
  const tab = key && panel.querySelector(`[data-tab-key="${key}"]`);
  if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
};

const expandCollapsedAccordion = (element) => {
  const collapsed = element.closest('.accordion-collapse:not(.show)');
  collapsed?.parentElement?.querySelector(':scope > .accordion-header')?.click();
};

// The handler card for event fields; otherwise the Inspector row of fields without a code editor
// (toggles, pickers, selects), found by param key. Records are `[section, paramKey, ...]`.
const findFieldRow = (panel, record) => {
  if (record.entityType === 'event') return panel.querySelector(`[data-event-id="${CSS.escape(record.eventId)}"]`);
  if (!hasInspectorTabs(record) || record.fieldPath.length < 2) return null;
  return panel.querySelector(`.tab-pane.active [data-param="${CSS.escape(String(record.fieldPath[1]))}"]`);
};

// Steps whose opened place is marked `data-reveal-root="<kind>:<itemId>"`: a popover, or a request
// sub-tab's pane (inactive panes stay mounted, so the match must not land in one). Other tabs have no root.
const ROOT_KINDS = new Set(['listItem', 'event', 'page', 'preloadedScript', 'queryParam', 'restTab']);
const revealRootOf = (step) =>
  document.querySelector(`[data-reveal-root="${CSS.escape(`${step.kind}:${step.itemId}`)}"]`);

// Inside an opened popover, the field's own wrapper when it has a key (a column's name and key often
// hold the same text), else the whole popover.
const fieldScope = (root, record) =>
  root.querySelector(`[data-param="${CSS.escape(String(record.fieldPath[record.fieldPath.length - 1]))}"]`) || root;

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
// when it has one, else its handler card / field row by key, else the whole panel. `openedSteps` are
// the reveal steps navigation opened; the match is looked for inside the innermost opened popover.
export const highlightMatch = (match, openedSteps = []) => {
  const { record } = match;
  const started = performance.now();
  const innermost = openedSteps.filter((step) => ROOT_KINDS.has(step.kind)).at(-1);
  // An event's fields are edited in its handler popover; if that didn't open, its card is the target.
  const editorsAllowed = record.entityType !== 'event' || innermost?.kind === 'event';
  let lastRoot = null;
  const tick = () => {
    const sidebarPanel = document.querySelector(panelSelectorFor(record));
    const elapsed = performance.now() - started;
    // Re-applied every frame: selecting a component re-renders the Inspector back to Properties.
    if (sidebarPanel) selectTab(sidebarPanel, record);
    let panel = sidebarPanel;
    if (innermost) {
      // Clicking a result closes an open popover (outside click) before the request reopens it, so the
      // popover counts only once the same element shows on two frames in a row.
      const root = revealRootOf(innermost);
      const stable = root && root === lastRoot;
      lastRoot = root;
      if (!stable) return elapsed > TIMEOUT_MS ? flash(sidebarPanel) : requestAnimationFrame(tick);
      panel = fieldScope(root, record);
    }
    const handlerCard = panel && !editorsAllowed && findFieldRow(panel, record);
    if (handlerCard) return revealAndFlash(handlerCard);
    const settled = elapsed > EXACT_WAIT_MS;
    const editor = panel && editorsAllowed && findEditor(panel, match, false);
    if (editor) return revealAndFlash(editor.element, () => selectOccurrence(editor.view, match));
    if (panel && settled) {
      const row = findFieldRow(panel, record);
      if (row) return revealAndFlash(row);
      const partial = editorsAllowed && findEditor(panel, match, true);
      if (partial) return revealAndFlash(partial.element, () => selectOccurrence(partial.view, match));
    }
    if (elapsed > TIMEOUT_MS) return flash(panel);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
