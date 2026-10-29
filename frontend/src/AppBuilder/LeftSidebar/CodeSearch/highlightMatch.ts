import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import type { FocusTarget } from '@/AppBuilder/_stores/slices/codeSearchSlice';
import type { RevealStep, SearchRecord } from './buildSearchRecords';
import type { SearchMatch } from './searchRecords';

// Where a result lands once navigation has opened its place. A field shown in a code editor is
// selected by that editor itself (it takes the store's focus request, see codeSearchHighlight);
// the DOM lookups here are the fallback for fields without one, and for popover rows.

type FoundEditor = { element: HTMLElement; view: EditorView };

const FLASH_CLASS = 'tj-code-search-flash';
const FLASH_MS = 1500;
const TIMEOUT_MS = 2000;

const flash = (element: HTMLElement | null) => {
  if (!element) return;
  element.classList.remove(FLASH_CLASS);
  void element.offsetWidth; // restart the animation when the same element flashes twice
  element.classList.add(FLASH_CLASS);
  setTimeout(() => element.classList.remove(FLASH_CLASS), FLASH_MS);
};

// Pages are edited in their details popover; libraries and the preloaded script in the Libraries
// panel; other app settings in Global settings; components and page settings in the right sidebar.
const PANEL_SELECTORS: Record<string, string> = {
  query: '.query-manager',
  page: '#add-new-page-popup',
};
const LIBRARY_FIELDS = new Set(['preloadedScript', 'libraries']);
const panelSelectorFor = (record: SearchRecord) => {
  const ownerType = record.ownerType || record.entityType;
  if (ownerType === 'app' && LIBRARY_FIELDS.has(record.fieldPath[0])) return '.app-libraries-panel';
  if (record.entityId === 'app') return '.global-settings-panel';
  return PANEL_SELECTORS[ownerType] || '.editor-sidebar .inspector';
};

// Inactive tab panes and closed sections stay mounted; only what is on screen can be the field. A
// field in a collapsed Inspector section counts when the section itself is on screen: landing on
// it expands the section (expandCollapsedAccordion).
const isVisible = (element: Element) => {
  const collapsed = element.closest('.accordion-collapse:not(.show)');
  return (collapsed?.parentElement ?? element).getClientRects().length > 0;
};

const editorsIn = (scope: Element): FoundEditor[] =>
  [...scope.querySelectorAll<HTMLElement>('.cm-editor')]
    .filter(isVisible)
    .map((element) => ({ element, view: EditorView.findFromDOM(element) }))
    .filter((editor): editor is FoundEditor => Boolean(editor.view));

// The editor whose text equals the indexed field is the field itself (editors render
// replaceIdsWithName(initialValue), the same text the index holds). Otherwise, when allowed, the
// first editor that contains the match.
const findEditor = (scope: Element, target: FocusTarget, allowPartial: boolean) => {
  const editors = editorsIn(scope);
  const exact = editors.find(({ view }) => view.state.doc.toString() === target.text);
  if (exact || !allowPartial) return exact;
  const needle = target.text.slice(target.start, target.end);
  return editors.find(({ view }) => view.state.doc.toString().includes(needle));
};

const STYLE_SECTIONS = ['styles', 'generalStyles'];
// Leading path keys that name where a field is stored, not the field (`properties.data`, `options.url`).
const SECTION_KEYS = new Set(['properties', 'styles', 'general', 'generalStyles', 'validation', 'others', 'options']);

// Component fields and app-wide page settings both live under Properties / Styles tabs.
const hasInspectorTabs = (record: SearchRecord) =>
  record.ownerType === 'component' || record.entityType === 'component' || record.entityId === 'pageSettings';

// The Properties / Styles tab a field lives under (the Inspector's or page settings' tab key).
export const tabKeyFor = (record: SearchRecord) => {
  if (!hasInspectorTabs(record)) return null;
  return record.entityType !== 'event' && STYLE_SECTIONS.includes(record.fieldPath[0]) ? 'styles' : 'properties';
};

const expandCollapsedAccordion = (element: Element) => {
  const collapsed = element.closest('.accordion-collapse:not(.show)');
  collapsed?.parentElement?.querySelector<HTMLElement>(':scope > .accordion-header')?.click();
};

const keyedIn = (scope: Element, key: string) =>
  [...scope.querySelectorAll<HTMLElement>(`[data-param="${CSS.escape(key)}"]`)].filter(isVisible);

// Elements tagged with the deepest path key tagged in `scope`. Earlier keys only break ties: an element
// nested in one tagged with an earlier key wins (`pageHeader` › `showOnDesktop`, not the footer's).
// Deepest first, because a path's middle keys can name other fields (`columns.value[i].label`).
const deepestTagged = (scope: Element, keys: string[]): HTMLElement[] | null => {
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

// Keys a wrapper of the field may be tagged with. Inside an opened request tab any path key may be
// the tagged one, since the tab holds only that item. In a whole panel the field's own key must be
// tagged, or an inner key like `name` could land on another field.
const anchorKeys = ({ keys, inOpenedTab }: FocusTarget) => (inOpenedTab ? keys : keys.slice(0, 1));

// The field's own wrappers (`data-param="<key>"`); in a whole panel, deeper keys narrow within it.
const findFieldElements = (scope: Element, target: FocusTarget) => {
  if (target.inOpenedTab) return deepestTagged(scope, target.keys);
  const anchors = keyedIn(scope, target.keys[0]);
  if (!anchors.length) return null;
  const inner = anchors.flatMap((anchor) => deepestTagged(anchor, target.keys.slice(1)) || []);
  return inner.length ? inner : anchors;
};

// A match that lives in a popover flashes that popover's row. Search already shows the path inside it.
// These are not opened.
const POPOVER_KINDS = new Set<RevealStep['kind']>(['listItem', 'event', 'page', 'queryParam', 'preloadedScript']);
export const popoverStepOf = (record: SearchRecord) =>
  (record.reveal || []).find((step) => POPOVER_KINDS.has(step.kind));
const popoverTrigger = (record: SearchRecord, step: RevealStep): HTMLElement | null => {
  const id = CSS.escape(String(step.itemId));
  if (step.kind === 'event')
    return document.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(record.eventId || '')}"]`);
  if (step.kind === 'page') return document.querySelector<HTMLElement>(`[data-page-id="${id}"]`);
  if (step.kind === 'preloadedScript') return document.querySelector<HTMLElement>('[data-preloaded-script]');
  return document.querySelector<HTMLElement>(`[data-list-item-id="${id}"]`);
};

// Steps whose opened place is marked `data-reveal-root="<kind>:<itemId>"`: a request sub-tab's pane
// (inactive panes stay mounted, so the match must not land in one). Other tabs have no root.
const ROOT_KINDS = new Set<RevealStep['kind']>(['restTab']);

// What the field's editor needs to recognise and select the match: where to look, the keys its
// wrapper is tagged with, and the clicked occurrence. `openedSteps` are the tabs navigation opened.
export const focusTargetFor = (match: SearchMatch, openedSteps: RevealStep[] = []): FocusTarget => {
  const { record, start, end } = match;
  const roots = openedSteps.filter((step) => ROOT_KINDS.has(step.kind));
  const innermost = roots[roots.length - 1];
  const keys = record.fieldPath.map(String);
  const own = SECTION_KEYS.has(keys[0]) && keys.length > 1 ? keys.slice(1) : keys;
  return {
    scope: innermost
      ? `[data-reveal-root="${`${innermost.kind}:${innermost.itemId}`.replace(/["\\]/g, '\\$&')}"]`
      : panelSelectorFor(record),
    keys: innermost ? keys : own,
    inOpenedTab: Boolean(innermost),
    text: record.text,
    start,
    end,
  };
};

// Where the clicked occurrence starts in `text`: the same offset when it is the indexed text, else
// the same-numbered copy of the needle (the 3rd `foo` stays the 3rd), else the first.
const occurrenceStart = (text: string, target: FocusTarget) => {
  const needle = target.text.slice(target.start, target.end);
  if (text === target.text) return target.start;
  let nth = 0;
  for (let at = target.text.indexOf(needle); at >= 0 && at < target.start; at = target.text.indexOf(needle, at + 1))
    nth++;
  let from = text.indexOf(needle);
  for (let i = 0; i < nth && from >= 0; i++) {
    const next = text.indexOf(needle, from + 1);
    if (next < 0) break;
    from = next;
  }
  return from;
};

const selectOccurrence = (view: EditorView, target: FocusTarget) => {
  const from = occurrenceStart(view.state.doc.toString(), target);
  if (from < 0) return;
  view.dispatch({
    selection: EditorSelection.single(from, from + target.end - target.start),
    scrollIntoView: true,
  });
  view.focus();
};

// A plain text input holding the field (a name, a handle): select the match in it.
const selectInInput = (element: HTMLElement, target: FocusTarget) => {
  const input = (
    element.matches('input, textarea') ? element : element.querySelector('input[type="text"], textarea')
  ) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!input || input.disabled) return;
  const from = occurrenceStart(input.value, target);
  if (from < 0) return;
  input.focus();
  input.setSelectionRange(from, from + target.end - target.start);
};

const revealAndFlash = (element: HTMLElement, afterScroll?: () => void) => {
  expandCollapsedAccordion(element);
  // Let the accordion expand paint before scrolling to the field.
  requestAnimationFrame(() => {
    element.scrollIntoView?.({ block: 'center' });
    afterScroll?.();
    flash(element);
  });
};

// The `data-param` keys tagged on `element`'s ancestors inside `scope`.
const taggedKeysOf = (element: Element, scope: Element) => {
  const keys: string[] = [];
  for (let at = element.parentElement; at && at !== scope; at = at.parentElement) {
    const key = at.getAttribute('data-param');
    if (key) keys.push(key);
  }
  return keys;
};

// Whether this code editor shows the requested field: it is on screen in the requested place, holds
// exactly the indexed text, and its wrapper is tagged with the field's key. An editor with no tagged
// wrapper (a query's main editor) is the field only when nothing on screen there carries the key.
export const editorHoldsField = (view: EditorView, target: FocusTarget) => {
  const scope = view.dom.closest(target.scope);
  if (!scope || !isVisible(view.dom) || view.state.doc.toString() !== target.text) return false;
  const anchors = anchorKeys(target);
  const tagged = taggedKeysOf(view.dom, scope);
  if (tagged.length) return tagged.some((key) => anchors.includes(key));
  return anchors.every((key) => !keyedIn(scope, key).length);
};

// Flashed around the editor: CodeMirror rewrites its own root's class whenever it updates.
export const landInEditor = (view: EditorView, target: FocusTarget) =>
  revealAndFlash(view.dom.parentElement ?? view.dom, () => selectOccurrence(view, target));

// A field no code editor took: its own tagged row (a toggle, select, picker or plain input, or an
// editor whose text differs from the index). False when the place shows no such row.
export const landOnTaggedField = (target: FocusTarget) => {
  const scope = document.querySelector<HTMLElement>(target.scope);
  const elements = scope && findFieldElements(scope, target);
  if (!elements) return false;
  const editor = elements.map((element) => findEditor(element, target, true)).find(Boolean);
  if (editor) landInEditor(editor.view, target);
  else revealAndFlash(elements[0], () => selectInInput(elements[0], target));
  return true;
};

// Last resort: any editor there containing the match, else the whole place.
export const landAnywhere = (target: FocusTarget) => {
  const scope = document.querySelector<HTMLElement>(target.scope);
  const editor = scope && findEditor(scope, target, true);
  if (editor) landInEditor(editor.view, target);
  else flash(scope);
};

// A popover match flashes the row that opens it, once that row has rendered. The field inside stays
// closed; the result label already says which control is in there.
export const flashPopover = (match: SearchMatch, step: RevealStep) => {
  const { record } = match;
  const started = performance.now();
  const tick = () => {
    const trigger = popoverTrigger(record, step);
    if (trigger && isVisible(trigger)) return revealAndFlash(trigger);
    if (performance.now() - started > TIMEOUT_MS)
      return flash(document.querySelector<HTMLElement>(panelSelectorFor(record)));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
