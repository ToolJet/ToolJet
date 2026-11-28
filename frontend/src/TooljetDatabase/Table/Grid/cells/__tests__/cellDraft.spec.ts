import {
  draftCanSave,
  draftChanged,
  draftPayload,
  initialDraft,
  jsonDraftError,
  setDraftMode,
  setDraftText,
} from '../cellDraft';

describe('initialDraft', () => {
  it('opens a stored value as value mode with its text', () => {
    expect(initialDraft('hello', 'character varying')).toEqual({ mode: 'value', text: 'hello' });
    expect(initialDraft(5, 'integer')).toEqual({ mode: 'value', text: '5' });
    expect(initialDraft(true, 'boolean')).toEqual({ mode: 'value', text: 'true' });
  });

  it('opens a null cell in null mode with nothing typed', () => {
    expect(initialDraft(null, 'character varying')).toEqual({ mode: 'null', text: '' });
  });

  it('opens a null boolean on false, so turning NULL off has a choice selected', () => {
    expect(initialDraft(null, 'boolean')).toEqual({ mode: 'null', text: 'false' });
  });

  it('shows JSON indented so a long document is readable', () => {
    expect(initialDraft({ a: 1 }, 'jsonb').text).toBe('{\n  "a": 1\n}');
  });
});

describe('jsonDraftError', () => {
  it.each(['{"a":1}', '[1,2]', '"text"', '42', 'null', 'true'])('accepts %s', (text) => {
    expect(jsonDraftError(text)).toBeNull();
  });

  it.each(['', '   ', '{a:1}', '{"a":', "{'a':1}"])('refuses %p', (text) => {
    expect(jsonDraftError(text)).toBe('Invalid JSON');
  });
});

describe('draftChanged', () => {
  it('is false until something differs from the stored value', () => {
    const initial = initialDraft('a', 'character varying');
    expect(draftChanged(initial, initial, 'character varying')).toBe(false);
    expect(draftChanged(initial, setDraftText(initial, 'b'), 'character varying')).toBe(true);
  });

  it('is false again after a round trip through NULL, because the text is kept', () => {
    const initial = initialDraft('a', 'character varying');
    const toNull = setDraftMode(initial, 'null');
    expect(draftChanged(initial, toNull, 'character varying')).toBe(true);
    expect(draftChanged(initial, setDraftMode(toNull, 'value'), 'character varying')).toBe(false);
  });

  it('ignores typed text while the draft is NULL or default', () => {
    const initial = initialDraft(null, 'character varying');
    expect(draftChanged(initial, setDraftText(initial, 'x'), 'character varying')).toBe(false);
  });

  it('turning NULL off on a text cell is a change to an empty string', () => {
    const initial = initialDraft(null, 'character varying');
    expect(draftChanged(initial, setDraftMode(initial, 'value'), 'character varying')).toBe(true);
  });

  it('compares JSON by value, not by spacing', () => {
    const initial = initialDraft({ a: 1 }, 'jsonb');
    expect(draftChanged(initial, setDraftText(initial, '{"a":1}'), 'jsonb')).toBe(false);
    expect(draftChanged(initial, setDraftText(initial, '{"a":2}'), 'jsonb')).toBe(true);
  });

  it('treats the default mode as a change from any stored value', () => {
    const initial = initialDraft('a', 'character varying');
    expect(draftChanged(initial, setDraftMode(initial, 'default'), 'character varying')).toBe(true);
  });
});

describe('draftCanSave', () => {
  it('needs a change', () => {
    const initial = initialDraft('a', 'character varying');
    expect(draftCanSave(initial, initial, 'character varying')).toBe(false);
  });

  it('refuses invalid JSON in value mode, but not in NULL mode', () => {
    const initial = initialDraft({ a: 1 }, 'jsonb');
    expect(draftCanSave(initial, setDraftText(initial, '{'), 'jsonb')).toBe(false);
    expect(draftCanSave(initial, setDraftMode(setDraftText(initial, '{'), 'null'), 'jsonb')).toBe(true);
  });

  it('refuses an empty timestamp in value mode', () => {
    const initial = initialDraft('2026-01-01T00:00:00Z', 'timestamp with time zone');
    expect(draftCanSave(initial, setDraftText(initial, ''), 'timestamp with time zone')).toBe(false);
  });
});

describe('draftPayload', () => {
  it('sends text as typed', () => {
    expect(draftPayload({ mode: 'value', text: '12' }, 'integer')).toEqual({ kind: 'value', value: '12' });
  });

  it('sends null in NULL mode and the default marker in default mode', () => {
    expect(draftPayload({ mode: 'null', text: 'x' }, 'character varying')).toEqual({ kind: 'value', value: null });
    expect(draftPayload({ mode: 'default', text: 'x' }, 'character varying')).toEqual({ kind: 'default' });
  });

  it('sends a boolean as a boolean', () => {
    expect(draftPayload({ mode: 'value', text: 'true' }, 'boolean')).toEqual({ kind: 'value', value: true });
    expect(draftPayload({ mode: 'value', text: 'false' }, 'boolean')).toEqual({ kind: 'value', value: false });
  });

  it('sends JSON parsed, so it is not saved as a string', () => {
    expect(draftPayload({ mode: 'value', text: '{"a": 1}' }, 'jsonb')).toEqual({ kind: 'value', value: { a: 1 } });
  });
});
