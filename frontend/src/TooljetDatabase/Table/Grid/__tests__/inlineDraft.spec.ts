/** @jest-environment node */
import {
  buildRowPayload,
  IDLE_DRAFT,
  inlineDraftReducer,
  mapRowError,
  unsetLabel,
  type InlineDraft,
} from '../inlineDraft';
import type { GridColumn } from '../useTableGrid';

const column = (accessor: string, dataType: string, extra: Partial<GridColumn> = {}): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: { is_not_null: false },
  ...extra,
});

const drafting = (values: Record<string, string> = {}): InlineDraft => ({
  ...IDLE_DRAFT,
  status: 'drafting',
  values,
  round: 1,
});
const saving = (values: Record<string, string> = {}): InlineDraft => ({ ...drafting(values), status: 'saving' });

describe('inlineDraftReducer', () => {
  it('opens an empty draft from idle', () => {
    const next = inlineDraftReducer(IDLE_DRAFT, { type: 'start' });

    expect(next).toMatchObject({ status: 'drafting', values: {}, errors: {}, rowError: null });
    expect(next.round).toBe(IDLE_DRAFT.round + 1);
  });

  it('ignores start while a draft is open', () => {
    const open = drafting({ title: 'a' });

    expect(inlineDraftReducer(open, { type: 'start' })).toBe(open);
    expect(inlineDraftReducer(saving(), { type: 'start' }).status).toBe('saving');
  });

  it('records typed values and drops a value that was cleared', () => {
    const typed = inlineDraftReducer(drafting(), { type: 'edit', column: 'title', value: 'a' });
    expect(typed.values).toEqual({ title: 'a' });

    const cleared = inlineDraftReducer(typed, { type: 'edit', column: 'title', value: '' });
    expect(cleared.values).toEqual({});
  });

  it('clears the error of the cell being edited, and the row error, but not other cells', () => {
    const failed: InlineDraft = {
      ...drafting({ a: 'x', b: 'y' }),
      errors: { a: 'Value already exists', b: 'Cannot be null' },
      rowError: 'boom',
    };

    const next = inlineDraftReducer(failed, { type: 'edit', column: 'a', value: 'z' });

    expect(next.errors).toEqual({ b: 'Cannot be null' });
    expect(next.rowError).toBeNull();
  });

  it('ignores edits unless drafting', () => {
    expect(inlineDraftReducer(IDLE_DRAFT, { type: 'edit', column: 'a', value: 'x' })).toBe(IDLE_DRAFT);
    const busy = saving({ a: 'x' });
    expect(inlineDraftReducer(busy, { type: 'edit', column: 'a', value: 'y' })).toBe(busy);
  });

  it('moves to saving on save and clears old errors', () => {
    const failed: InlineDraft = { ...drafting({ a: 'x' }), errors: { a: 'bad' }, rowError: 'boom' };

    const next = inlineDraftReducer(failed, { type: 'save' });

    expect(next).toMatchObject({ status: 'saving', values: { a: 'x' }, errors: {}, rowError: null });
  });

  it('ignores a second save while saving, and a save without a draft', () => {
    const busy = saving({ a: 'x' });

    expect(inlineDraftReducer(busy, { type: 'save' })).toBe(busy);
    expect(inlineDraftReducer(IDLE_DRAFT, { type: 'save' })).toBe(IDLE_DRAFT);
  });

  it('opens a new empty draft after a successful save', () => {
    const next = inlineDraftReducer(saving({ a: 'x' }), { type: 'saveOk' });

    expect(next).toMatchObject({ status: 'drafting', values: {}, errors: {}, rowError: null });
    expect(next.round).toBe(2);
  });

  it('goes back to drafting with the values and the errors after a refused save', () => {
    const next = inlineDraftReducer(saving({ a: 'x' }), {
      type: 'saveErr',
      errors: { a: 'Value already exists' },
      rowError: null,
    });

    expect(next).toMatchObject({ status: 'drafting', values: { a: 'x' }, errors: { a: 'Value already exists' } });
  });

  it('carries a row error that no column owns', () => {
    const next = inlineDraftReducer(saving(), { type: 'saveErr', errors: {}, rowError: 'plan limit reached' });

    expect(next.rowError).toBe('plan limit reached');
  });

  it('ignores a late save result once the draft is no longer saving', () => {
    const cancelled = inlineDraftReducer(drafting(), { type: 'cancel' });

    expect(inlineDraftReducer(cancelled, { type: 'saveOk' })).toBe(cancelled);
    expect(inlineDraftReducer(cancelled, { type: 'saveErr', errors: {}, rowError: 'x' })).toBe(cancelled);
    const reopened = drafting({ a: 'new' });
    expect(inlineDraftReducer(reopened, { type: 'saveOk' })).toBe(reopened);
  });

  it('cancels a draft back to idle, but not one that is being saved', () => {
    expect(inlineDraftReducer(drafting({ a: 'x' }), { type: 'cancel' })).toMatchObject({ status: 'idle', values: {} });
    const busy = saving({ a: 'x' });
    expect(inlineDraftReducer(busy, { type: 'cancel' })).toBe(busy);
  });

  it('reset drops the draft in any state', () => {
    expect(inlineDraftReducer(saving({ a: 'x' }), { type: 'reset' }).status).toBe('idle');
    expect(inlineDraftReducer(drafting({ a: 'x' }), { type: 'reset' }).values).toEqual({});
  });
});

describe('unsetLabel', () => {
  it.each([
    ['a serial column', column('id', 'serial'), 'Auto'],
    ['a column with a default', column('status', 'character varying', { column_default: 'new' }), 'new'],
    [
      'a jsonb column with a default',
      column('meta', 'jsonb', { column_default: { a: 1 } as unknown as string }),
      '{"a":1}',
    ],
    ['a nullable column', column('note', 'character varying'), 'NULL'],
    [
      'a NOT NULL column without a default',
      column('code', 'character varying', { constraints_type: { is_not_null: true } }),
      'Required',
    ],
    [
      'a primary key without a default',
      column('code', 'character varying', { constraints_type: { is_primary_key: true } }),
      'Required',
    ],
  ])('reads %s as %s', (_name, col, label) => {
    expect(unsetLabel(col)).toBe(label);
  });
});

describe('buildRowPayload', () => {
  const columns = [
    column('id', 'serial'),
    column('title', 'character varying'),
    column('views', 'integer'),
    column('published', 'boolean'),
    column('status', 'character varying', { column_default: 'new' }),
  ];

  it('leaves untouched columns out, so defaults and NULL apply on the server', () => {
    expect(buildRowPayload(columns, { title: 'Hello' })).toEqual({ title: 'Hello' });
  });

  it('sends typed text as typed and a boolean as a boolean', () => {
    expect(buildRowPayload(columns, { views: '12', published: 'false' })).toEqual({ views: '12', published: false });
    expect(buildRowPayload(columns, { published: 'true' })).toEqual({ published: true });
  });

  it('never sends a serial column', () => {
    expect(buildRowPayload(columns, { id: '99', title: 'x' })).toEqual({ title: 'x' });
  });
});

describe('mapRowError', () => {
  const columns = [column('email', 'character varying'), column('age', 'integer'), column('name', 'character varying')];

  it('puts a unique violation on the column the message names', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint users.email' };

    expect(mapRowError(error, columns, { email: 'a@b.c' })).toEqual({
      errors: { email: 'Value already exists' },
      rowError: null,
    });
  });

  it('puts a not null violation on its column', () => {
    const error = { code: '23502', message: 'null value in column violates not-null constraint users.name' };

    expect(mapRowError(error, columns, {})).toEqual({ errors: { name: 'Cannot be null' }, rowError: null });
  });

  it('marks the typed columns that hold the value a type error rejects', () => {
    const error = { code: '22P02', message: 'Invalid input syntax for type integer: "abc"' };

    expect(mapRowError(error, columns, { age: 'abc', email: 'abc' })).toEqual({
      errors: { age: 'Data type mismatch' },
      rowError: null,
    });
  });

  it('falls back to a row error when the column is unknown or the failure is something else', () => {
    expect(mapRowError({ code: '23505', message: 'duplicate key users.gone' }, columns, {})).toEqual({
      errors: {},
      rowError: 'duplicate key users.gone',
    });
    expect(mapRowError({ message: 'Your plan has reached its rows limit' }, columns, {})).toEqual({
      errors: {},
      rowError: 'Your plan has reached its rows limit',
    });
    expect(mapRowError({}, columns, {}).rowError).toBe('Failed to add the row');
  });
});
