import { isEqual } from 'lodash';

// What a cell editor holds while it is open. Every type keeps its draft as text (a boolean as 'true'/'false', a
// timestamp as the string the table stores, JSON as the document's text); `mode` says whether that text is what gets
// saved, or NULL, or the column's default. The text survives a trip through NULL, so switching back loses nothing.
export type CellMode = 'value' | 'null' | 'default';
export type CellDraft = { mode: CellMode; text: string };

/** What a save sends: a value (null included), or "use the column default" (a separate server action). */
export type CellPayload = { kind: 'value'; value: unknown } | { kind: 'default' };

const JSON_TYPE = 'jsonb';
const BOOLEAN_TYPE = 'boolean';
const TIMESTAMP_TYPE = 'timestamp with time zone';

const draftText = (value: unknown, dataType: string): string => {
  if (value == null) return dataType === BOOLEAN_TYPE ? 'false' : '';
  if (dataType === JSON_TYPE) return JSON.stringify(value, null, 2);
  return String(value);
};

export const initialDraft = (value: unknown, dataType: string): CellDraft => ({
  mode: value == null ? 'null' : 'value',
  text: draftText(value, dataType),
});

export const setDraftText = (draft: CellDraft, text: string): CellDraft => ({ ...draft, text });
export const setDraftMode = (draft: CellDraft, mode: CellMode): CellDraft => ({ ...draft, mode });

const parseJson = (text: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

export const jsonDraftError = (text: string): string | null => (parseJson(text).ok ? null : 'Invalid JSON');

export const draftChanged = (initial: CellDraft, draft: CellDraft, dataType: string): boolean => {
  if (draft.mode !== initial.mode) return true;
  if (draft.mode !== 'value') return false;
  if (dataType === JSON_TYPE) {
    const before = parseJson(initial.text);
    const after = parseJson(draft.text);
    return before.ok && after.ok ? !isEqual(before.value, after.value) : initial.text !== draft.text;
  }
  return draft.text !== initial.text;
};

export const draftCanSave = (initial: CellDraft, draft: CellDraft, dataType: string): boolean => {
  if (!draftChanged(initial, draft, dataType)) return false;
  if (draft.mode !== 'value') return true;
  if (dataType === JSON_TYPE) return jsonDraftError(draft.text) === null;
  if (dataType === TIMESTAMP_TYPE) return draft.text !== '';
  return true;
};

export const draftPayload = (draft: CellDraft, dataType: string): CellPayload => {
  if (draft.mode === 'default') return { kind: 'default' };
  if (draft.mode === 'null') return { kind: 'value', value: null };
  if (dataType === BOOLEAN_TYPE) return { kind: 'value', value: draft.text === 'true' };
  if (dataType === JSON_TYPE) {
    const parsed = parseJson(draft.text);
    return { kind: 'value', value: parsed.ok ? parsed.value : draft.text };
  }
  return { kind: 'value', value: draft.text };
};
