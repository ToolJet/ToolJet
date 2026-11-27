/**
 * Every place in the app that may use a variable, for the rename and delete warnings.
 *
 * Variables have no ids: code names them, and some code builds the name at runtime
 * (`variables[key]`, aliases, Object.keys(variables)), so no scan is complete. This runs the Code
 * Search index over the whole saved app (every page, query, event and app setting) for the name
 * as a whole word, then sorts each hit:
 *   - confirmed: a direct access in the variable's own scope — `variables.x`, `variables?.x`,
 *     `variables["x"]`, `setVariable("x")` / `getVariable` / `unSetVariable`, or the plain key of a
 *     Set / Get / Unset variable event action (page equivalents for page scope);
 *   - possible: anything else that mentions the name — destructuring, computed keys, the other
 *     scope, non-JS code. The builder checks these.
 */
import { createSearcher, type SearchInputDefinition } from '../CodeSearch/searchRecords';
import type { SearchRecord } from '../CodeSearch/buildSearchRecords';

export type ReferenceConfidence = 'confirmed' | 'possible';

export type VariableReference = {
  confidence: ReferenceConfidence;
  entityType: SearchRecord['entityType'];
  entityName: string;
  entitySubtype?: string;
  componentType?: string;
  pageId?: string | null;
  fieldLabel: string;
  preview: string;
  record: SearchRecord;
  start: number;
  end: number;
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const confirmedPatterns = (scope: 'app' | 'page', name: string): RegExp[] => {
  const n = escape(name);
  const access = (root: string) => [
    new RegExp(`${root}\\s*\\??\\.\\s*${n}(?![\\w$])`),
    new RegExp(`${root}\\s*(?:\\?\\.)?\\[\\s*(['"\`])${n}\\1\\s*\\]`),
  ];
  if (scope === 'app') {
    return [
      // `variables` not preceded by `page.` (or any other member access)
      ...access('(?<![\\w$.])variables'),
      new RegExp(`\\b(?:set|get|unSet|unset)Variable\\(\\s*(['"\`])${n}\\1`),
    ];
  }
  return [
    ...access('(?<![\\w$.])page\\s*\\??\\.\\s*variables'),
    new RegExp(`\\b(?:set|get|unSet|unset)PageVariable\\(\\s*(['"\`])${n}\\1`),
  ];
};

const APP_VARIABLE_ACTIONS = ['set-custom-variable', 'get-custom-variable', 'unset-custom-variable'];
const PAGE_VARIABLE_ACTIONS = ['set-page-variable', 'get-page-variable', 'unset-page-variable'];

// Declared variables are indexed on the app or a page at `['variables', key]` (value) and
// `['variables', key, 'name']` (name). The key is the variable's name, which may itself be
// `variables` or `name`, so the map is found at the start of the path, never by searching it.
const definitionKeyOf = (record: SearchRecord): string | null =>
  (record.entityType === 'app' || record.entityType === 'page') &&
  record.fieldPath[0] === 'variables' &&
  record.fieldPath.length >= 2
    ? record.fieldPath[1]
    : null;

// A declared variable's own name. Not the value of a variable that happens to be called `name`.
const isDefinitionName = (record: SearchRecord) =>
  definitionKeyOf(record) !== null && record.fieldPath.length === 3 && record.fieldPath[2] === 'name';

// Whole fields that are script code rather than text with {{ }} bindings.
const SCRIPT_FIELDS = new Set(['code', 'transformation', 'javascript', 'preloadedScript']);
// A declared variable's value (`['variables', key]`).
const isVariableValueField = (record: SearchRecord) =>
  definitionKeyOf(record) !== null && record.fieldPath.length === 2;
const isScriptField = (record: SearchRecord) => record.fieldPath.some((segment) => SCRIPT_FIELDS.has(segment));
const isEventKeyField = (record: SearchRecord) =>
  record.entityType === 'event' && record.fieldPath[record.fieldPath.length - 1] === 'key';

const bindingSpans = (text: string) => {
  const spans: Array<[number, number]> = [];
  const re = /\{\{[\s\S]*?\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) spans.push([m.index, m.index + m[0].length]);
  return spans;
};

/**
 * Hits that sit in code: inside {{ }}, anywhere in a script field or a whole-code variable value,
 * or an event action's key.
 */
const codeMatches = (
  record: SearchRecord,
  matches: Array<{ start: number; end: number }>,
  wholeFieldIsCode: boolean
) => {
  if (wholeFieldIsCode || isScriptField(record) || isEventKeyField(record)) return matches;
  const spans = bindingSpans(record.text);
  return matches.filter((m) => spans.some(([from, to]) => m.start >= from && m.end <= to));
};

const PREVIEW_LEAD = 24;
const PREVIEW_LENGTH = 120;
const previewAround = (text: string, start: number) => {
  const flat = text.replace(/\s+/g, ' ');
  const from = Math.max(0, start - PREVIEW_LEAD);
  const slice = flat.slice(from, from + PREVIEW_LENGTH);
  return `${from > 0 ? '…' : ''}${slice}${from + PREVIEW_LENGTH < flat.length ? '…' : ''}`;
};

export function findVariableReferences(
  input: SearchInputDefinition,
  { scope, name, currentPageId = null }: { scope: 'app' | 'page'; name: string; currentPageId?: string | null }
): VariableReference[] {
  if (!name) return [];
  const result = createSearcher()({
    input,
    term: name,
    filters: { wholeWord: true, caseSensitive: true, regex: false, type: 'all', currentPageOnly: false },
    currentPageId,
  });
  const patterns = confirmedPatterns(scope, name);
  // Another declared variable's value is indexed under its name, in app settings or on its page.
  const definitionOf = (record: SearchRecord) => {
    const key = definitionKeyOf(record);
    if (key === null) return null;
    const isPage = record.entityType === 'page';
    const map = isPage
      ? (input.pages as any[]).find((p) => p?.id === record.pageId)?.variables
      : (input.globalSettings as any)?.variables;
    const entry = map?.[key];
    if (!entry) return null;
    // Development data saved before maps were keyed by name keeps the name inside the entry.
    const name = typeof entry.id === 'string' && typeof entry.name === 'string' ? entry.name : key;
    return { name, entry, scopeLabel: isPage ? 'Page variable' : 'App variable' };
  };
  // A value runs as code only when it is an expression (see isExpressionValue / toExpression):
  // with fx on and no {{ }}, all of it is code; otherwise only what is inside {{ }}.
  const wholeValueIsCode = (record: SearchRecord) => {
    if (!isVariableValueField(record)) return false;
    const entry = definitionOf(record)?.entry;
    return !!(entry?.fxActive ?? entry?.fx_active) && !(record.text.includes('{{') && record.text.includes('}}'));
  };
  const actionIdByEventId = new Map<string, string>(
    (input.events ?? []).map((event: any) => [event.id, event.event?.actionId])
  );
  const actions = scope === 'app' ? APP_VARIABLE_ACTIONS : PAGE_VARIABLE_ACTIONS;

  return result.rows
    .filter(({ record }) => !isDefinitionName(record))
    .map(({ record, matches }) => ({ record, matches: codeMatches(record, matches, wholeValueIsCode(record)) }))
    .filter(({ matches }) => matches.length > 0)
    .map(({ record, matches }) => {
      const text = record.text;
      const actionId = record.eventId ? actionIdByEventId.get(record.eventId) : undefined;
      const isEventKey = isEventKeyField(record) && text.trim() === name && actions.includes(actionId ?? '');
      const confirmed = isEventKey || patterns.some((pattern) => pattern.test(text));
      const first = matches[0] ?? { start: 0, end: 0 };
      const definition = isVariableValueField(record) ? definitionOf(record) : null;
      return {
        confidence: confirmed ? 'confirmed' : 'possible',
        entityType: record.entityType,
        entityName: definition?.name ?? record.entityName,
        entitySubtype: record.entitySubtype,
        componentType: record.componentType,
        pageId: record.pageId,
        fieldLabel: definition ? `${definition.scopeLabel} · Initial value` : record.fieldLabel,
        preview: previewAround(text, first.start),
        record,
        start: first.start,
        end: first.end,
      } as VariableReference;
    });
}
