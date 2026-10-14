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
// panel; other app settings in Global settings; components and page settings in the right sidebar.
const PANEL_SELECTORS = { query: '.query-manager', page: '#add-new-page-popup' };
const LIBRARY_FIELDS = new Set(['preloadedScript', 'libraries']);
const panelSelectorFor = (record) => {
  const ownerType = record.ownerType || record.entityType;
  if (ownerType === 'app' && LIBRARY_FIELDS.has(record.fieldPath[0])) return '.app-libraries-panel';
  if (record.entityId === 'app') return '.global-settings-panel';
  return PANEL_SELECTORS[ownerType] || '.editor-sidebar .inspector';
};

// Inactive tab panes and closed sections stay mounted; only what is on screen can be the field.
const isVisible = (element) => element.getClientRects().length > 0;

const editorsIn = (scope) =>
  [...scope.querySelectorAll('.cm-editor')]
    .filter(isVisible)
    .map((element) => ({ element, view: EditorView.findFromDOM(element) }))
    .filter(({ view }) => view);

// The editor whose text equals the indexed field is the field itself (editors render
// replaceIdsWithName(initialValue), the same text the index holds). Otherwise, when allowed, the
// first editor that contains the match.
const findEditor = (scope, match, allowPartial) => {
  const editors = editorsIn(scope);
  const exact = editors.find(({ view }) => view.state.doc.toString() === match.record.text);
  if (exact || !allowPartial) return exact;
  const needle = match.record.text.slice(match.start, match.end);
  return editors.find(({ view }) => view.state.doc.toString().includes(needle));
};

const STYLE_SECTIONS = ['styles', 'generalStyles'];
// Leading path keys that name where a field is stored, not the field (`properties.data`, `options.url`).
const SECTION_KEYS = new Set(['properties', 'styles', 'general', 'generalStyles', 'validation', 'others', 'options']);

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

// The handler card of an event whose popover didn't open.
const findHandlerCard = (panel, record) => panel.querySelector(`[data-event-id="${CSS.escape(record.eventId)}"]`);

const keyedIn = (scope, key) => [...scope.querySelectorAll(`[data-param="${CSS.escape(key)}"]`)].filter(isVisible);

// Elements tagged with the deepest path key tagged in `scope`. Earlier keys only break ties: an element
// nested in one tagged with an earlier key wins (`pageHeader` › `showOnDesktop`, not the footer's).
// Deepest first, because a path's middle keys can name other fields (`columns.value[i].label`).
const deepestTagged = (scope, keys) => {
  for (let i = keys.length - 1; i >= 0; i--) {
    const found = keyedIn(scope, keys[i]);
    if (!found.length) continue;
    const nested = found.filter((element) =>
      keys.slice(0, i).some((key) => {
        const ancestor = element.parentElement?.closest(`[data-param="${CSS.escape(key)}"]`);
        return ancestor && scope.contains(ancestor);
      })
    );
    return nested.length ? nested : found;
  }
  return null;
};

// The field's own wrappers (`data-param="<key>"`). Inside an opened popover any path key may be the
// tagged one, since the popover holds only that item. In a whole panel the field's own key must be
// tagged, or an inner key like `name` could land on another field; deeper keys narrow within it.
const findFieldElements = (scope, record, inPopover) => {
  const keys = record.fieldPath.map(String);
  if (inPopover) return deepestTagged(scope, keys);
  const own = SECTION_KEYS.has(keys[0]) && keys.length > 1 ? keys.slice(1) : keys;
  const anchors = keyedIn(scope, own[0]);
  if (!anchors.length) return null;
  const inner = anchors.flatMap((anchor) => deepestTagged(anchor, own.slice(1)) || []);
  return inner.length ? inner : anchors;
};

// A match that lives in a popover flashes that popover's row. Search already shows the path inside it.
// These are not opened.
const POPOVER_KINDS = new Set(['listItem', 'event', 'page', 'queryParam', 'preloadedScript']);
const popoverStepOf = (record) => (record.reveal || []).find((step) => POPOVER_KINDS.has(step.kind));
const popoverTrigger = (record, step) => {
  const id = CSS.escape(String(step.itemId));
  if (step.kind === 'event') return document.querySelector(`[data-event-id="${CSS.escape(record.eventId || '')}"]`);
  if (step.kind === 'page') return document.querySelector(`[data-page-id="${id}"]`);
  if (step.kind === 'preloadedScript') return document.querySelector('[data-preloaded-script]');
  return document.querySelector(`[data-list-item-id="${id}"]`);
};

// Steps whose opened place is marked `data-reveal-root="<kind>:<itemId>"`: a request sub-tab's pane
// (inactive panes stay mounted, so the match must not land in one). Other tabs have no root.
const ROOT_KINDS = new Set(['restTab']);
const revealRootOf = (step) =>
  document.querySelector(`[data-reveal-root="${CSS.escape(`${step.kind}:${step.itemId}`)}"]`);

// Where the clicked occurrence starts in `text`: the same offset when it is the indexed text, else
// the same-numbered copy of the needle (the 3rd `foo` stays the 3rd), else the first.
const occurrenceStart = (text, match) => {
  const needle = match.record.text.slice(match.start, match.end);
  if (text === match.record.text) return match.start;
  let nth = 0;
  for (
    let at = match.record.text.indexOf(needle);
    at >= 0 && at < match.start;
    at = match.record.text.indexOf(needle, at + 1)
  )
    nth++;
  let from = text.indexOf(needle);
  for (let i = 0; i < nth && from >= 0; i++) {
    const next = text.indexOf(needle, from + 1);
    if (next < 0) break;
    from = next;
  }
  return from;
};

const selectOccurrence = (view, match) => {
  const from = occurrenceStart(view.state.doc.toString(), match);
  if (from < 0) return;
  view.dispatch({ selection: EditorSelection.single(from, from + match.end - match.start), scrollIntoView: true });
  view.focus();
};

// A plain text input holding the field (a name, a handle): select the match in it.
const selectInInput = (element, match) => {
  const input = element.matches('input, textarea') ? element : element.querySelector('input[type="text"], textarea');
  if (!input || input.disabled) return;
  const from = occurrenceStart(input.value, match);
  if (from < 0) return;
  input.focus();
  input.setSelectionRange(from, from + match.end - match.start);
};

const revealAndFlash = (element, afterScroll) => {
  expandCollapsedAccordion(element);
  // Let the accordion expand paint before scrolling to the field.
  requestAnimationFrame(() => {
    element.scrollIntoView?.({ block: 'center' });
    afterScroll?.();
    flash(element);
  });
};

// A tagged wrapper: its own editor holding the match, else the wrapper itself (a toggle, select,
// picker or plain input).
const landOnFieldElement = (elements, match) => {
  const withEditor = (allowPartial) =>
    elements
      .map((element) => ({ element, editor: findEditor(element, match, allowPartial) }))
      .find(({ editor }) => editor);
  const found = withEditor(false) || withEditor(true);
  if (found) return revealAndFlash(found.editor.element, () => selectOccurrence(found.editor.view, match));
  const [element] = elements;
  revealAndFlash(element, () => selectInInput(element, match));
};

// A popover match flashes the row that opens it. The field inside stays closed; the result label
// already says which control is in there.
const flashPopover = (match, step) => {
  const { record } = match;
  const started = performance.now();
  const tick = () => {
    const trigger = popoverTrigger(record, step);
    if (trigger && isVisible(trigger)) return revealAndFlash(trigger);
    const panel = document.querySelector(panelSelectorFor(record));
    if (performance.now() - started > TIMEOUT_MS) return flash(panel);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Waits for the opened panel to render, then selects and flashes the match: in the field's own
// tagged wrapper when it has one, else in a code editor holding the text, else its handler card, else
// the whole panel. `openedSteps` are tabs navigation opened (a query request tab); the match is
// looked for inside that pane when it has one.
export const highlightMatch = (match, openedSteps = []) => {
  const { record } = match;
  const popoverStep = popoverStepOf(record);
  if (popoverStep) return flashPopover(match, popoverStep);
  const started = performance.now();
  const innermost = openedSteps.filter((step) => ROOT_KINDS.has(step.kind)).at(-1);
  const inEventPopover = true;
  let lastRoot = null;
  let lastField = null;
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
      panel = root;
    }
    if (panel && !inEventPopover) {
      const card = findHandlerCard(panel, record);
      if (card) return revealAndFlash(card);
    }
    if (panel && inEventPopover) {
      // Same element on two frames: its editor (if any) has mounted, and a re-render didn't replace it.
      const fields = findFieldElements(panel, record, Boolean(innermost));
      const stable = fields && fields[0] === lastField;
      lastField = fields?.[0] ?? null;
      if (stable) return landOnFieldElement(fields, match);
      if (!fields) {
        const editor = findEditor(panel, match, false);
        if (editor) return revealAndFlash(editor.element, () => selectOccurrence(editor.view, match));
        if (elapsed > EXACT_WAIT_MS) {
          const partial = findEditor(panel, match, true);
          if (partial) return revealAndFlash(partial.element, () => selectOccurrence(partial.view, match));
          // The opened popover is the item, but nothing in it shows this field (a stored key with no control).
          if (innermost) return flash(panel);
        }
      }
    }
    if (elapsed > TIMEOUT_MS) return flash(panel);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
