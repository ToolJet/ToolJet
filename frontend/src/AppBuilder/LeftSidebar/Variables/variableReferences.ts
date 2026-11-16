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

// The name field of the variable's own definition (globalSettings.variables / page.variables).
const isDefinitionName = (record: SearchRecord) =>
  record.fieldPath.includes('variables') && record.fieldPath[record.fieldPath.length - 1] === 'name';

// Whole fields that are script code rather than text with {{ }} bindings.
const SCRIPT_FIELDS = new Set(['code', 'transformation', 'javascript', 'preloadedScript']);
// A declared variable's value: fx values may have been saved without their {{ }}.
// The index drops a trailing `value` key, so a definition's value is `[..., 'variables', id]`.
const isVariableValueField = (record: SearchRecord) => {
  const at = record.fieldPath.lastIndexOf('variables');
  if (at === -1) return false;
  const rest = record.fieldPath.slice(at + 1);
  return rest.length === 1 || (rest.length === 2 && rest[1] === 'value');
};
const isScriptField = (record: SearchRecord) =>
  record.fieldPath.some((segment) => SCRIPT_FIELDS.has(segment)) || isVariableValueField(record);
const isEventKeyField = (record: SearchRecord) =>
  record.entityType === 'event' && record.fieldPath[record.fieldPath.length - 1] === 'key';

const bindingSpans = (text: string) => {
  const spans: Array<[number, number]> = [];
  const re = /\{\{[\s\S]*?\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) spans.push([m.index, m.index + m[0].length]);
  return spans;
};

/** Hits that sit in code: inside {{ }}, anywhere in a script field, or an event action's key. */
const codeMatches = (record: SearchRecord, matches: Array<{ start: number; end: number }>) => {
  if (isScriptField(record) || isEventKeyField(record)) return matches;
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
  const actionIdByEventId = new Map<string, string>(
    (input.events ?? []).map((event: any) => [event.id, event.event?.actionId])
  );
  const actions = scope === 'app' ? APP_VARIABLE_ACTIONS : PAGE_VARIABLE_ACTIONS;

  return result.rows
    .filter(({ record }) => !isDefinitionName(record))
    .map(({ record, matches }) => ({ record, matches: codeMatches(record, matches) }))
    .filter(({ matches }) => matches.length > 0)
    .map(({ record, matches }) => {
      const text = record.text;
      const actionId = record.eventId ? actionIdByEventId.get(record.eventId) : undefined;
      const isEventKey = isEventKeyField(record) && text.trim() === name && actions.includes(actionId ?? '');
      const confirmed = isEventKey || patterns.some((pattern) => pattern.test(text));
      const first = matches[0] ?? { start: 0, end: 0 };
      return {
        confidence: confirmed ? 'confirmed' : 'possible',
        entityType: record.entityType,
        entityName: record.entityName,
        entitySubtype: record.entitySubtype,
        componentType: record.componentType,
        pageId: record.pageId,
        fieldLabel: record.fieldLabel,
        preview: previewAround(text, first.start),
        record,
        start: first.start,
        end: first.end,
      } as VariableReference;
    });
}
