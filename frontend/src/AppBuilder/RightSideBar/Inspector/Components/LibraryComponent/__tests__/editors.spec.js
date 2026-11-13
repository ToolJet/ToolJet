import { readLiteralCode, writeLiteralCode } from '../literal';
import { editorHint, fieldMeta, hasOptionDefault, styleFieldMeta } from '../utils';
import { withField, newEntry } from '../OptionsEditor';
import { columnsFromData, newColumn, withColumnField } from '../ColumnsEditor';

describe('LibraryComponent inspector editors', () => {
  it('reads stamped, typed and plain JSON list values, and refuses bindings', () => {
    expect(readLiteralCode('{{[{"label":"A","value":1}]}}')).toEqual({ ok: true, value: [{ label: 'A', value: 1 }] });
    expect(readLiteralCode("{{[{ label: 'A', value: 'a', }, 'B']}}")).toEqual({
      ok: true,
      value: [{ label: 'A', value: 'a' }, 'B'],
    });
    expect(readLiteralCode('[{"key":"id"}]')).toEqual({ ok: true, value: [{ key: 'id' }] });
    expect(readLiteralCode('{{queries.q.data}}').ok).toBe(false);
    expect(readLiteralCode('{{[1, 2].map((x) => x)}}').ok).toBe(false);
    expect(readLiteralCode('trending-up')).toEqual({ ok: true, value: 'trending-up' });
  });

  it('writes a value back that reads as the same value and never closes the binding early', () => {
    const value = [{ label: 'a}}b', value: 0, disabled: false }, 'x'];
    const code = writeLiteralCode(value);
    expect(code.slice(2, -2)).not.toContain('}}');
    expect(readLiteralCode(code).value).toEqual(value);
    expect(writeLiteralCode({ a: { b: 1 } })).toBe('{{ { a: { b: 1 } } }}');
  });

  it('picks the editor from the hint only for the type it writes', () => {
    expect(editorHint({ name: 'columns', type: 'array', inspector: 'columns' })).toBe('columns');
    expect(editorHint({ name: 'options', type: 'array', inspector: 'options' })).toBe('options');
    // The pack's lucide picker only for iconSet 'lucide'; a Tabler icon uses the native icon field.
    expect(editorHint({ name: 'icon', type: 'string', inspector: 'icon', iconSet: 'lucide' })).toBe('icon');
    expect(editorHint({ name: 'icon', type: 'string', inspector: 'icon' })).toBeUndefined();
    expect(editorHint({ name: 'icon', type: 'array', inspector: 'icon' })).toBeUndefined();
    expect(fieldMeta({ name: 'columns', type: 'array', inspector: 'columns' }).type).toBe('code');
    expect(fieldMeta({ name: 'tint', type: 'string', inspector: 'color' }).type).toBe('colorSwatches');
  });

  it('edits options without losing their shape or unknown keys', () => {
    expect(withField('A', 'label', 'B')).toBe('B');
    expect(withField('A', 'value', 'a')).toEqual({ label: 'A', value: 'a' });
    expect(withField({ label: 'A', value: false, group: 'g' }, 'disabled', true)).toEqual({
      label: 'A',
      value: false,
      group: 'g',
      disabled: true,
    });
    expect(withField({ label: 'A', value: 'a', disabled: true }, 'disabled', false)).toEqual({
      label: 'A',
      value: 'a',
    });
    expect(newEntry(['A', 'B'])).toBe('Option 3');
    expect(newEntry([{ label: 'A', value: 'a' }])).toEqual({ label: 'Option 2', value: 'option2' });
  });

  it('starts columns from the data and adds the next unshown key', () => {
    const data = [{ id: 1, name: 'Ada', meta: { a: 1 }, paid: true }];
    expect(columnsFromData(data)).toEqual([
      { key: 'id', name: 'id', columnType: 'number' },
      { key: 'name', name: 'name', columnType: 'string' },
      { key: 'paid', name: 'paid', columnType: 'boolean' },
    ]);
    expect(newColumn([{ key: 'id' }], ['id', 'name'])).toEqual({ key: 'name', name: 'name' });
    expect(newColumn([{ key: 'id' }], ['id'])).toEqual({ key: 'column_2', name: 'Column 2' });
    expect(withColumnField({ key: 'a', currency: 'EUR' }, 'currency', '')).toEqual({ key: 'a' });
  });

  it('offers the Default switch only on the pack components that read it', () => {
    expect(hasOptionDefault('shadcn', 'ButtonGroup')).toBe(true);
    expect(hasOptionDefault('antd', 'ButtonGroup')).toBe(false);
    expect(hasOptionDefault('shadcn', 'Select')).toBe(false);
    expect(hasOptionDefault(undefined, undefined)).toBe(false);
  });

  it('stores an option marked default and drops the mark when it is turned off', () => {
    const marked = withField({ label: 'Week', value: 'week' }, 'default', true);
    expect(marked).toEqual({ label: 'Week', value: 'week', default: true });
    expect(withField(marked, 'default', false)).toEqual({ label: 'Week', value: 'week' });
  });

  it('puts a style with a long label on its own line, and keeps a short one beside its control', () => {
    const long = styleFieldMeta({
      name: 'primary',
      label: 'Primary (palette.primary.main)',
      type: 'string',
      inspector: 'color',
    });
    expect(long).toEqual(expect.objectContaining({ type: 'colorSwatches', newLine: true }));
    const radius = styleFieldMeta({
      name: 'borderRadius',
      label: 'Border radius (shape.borderRadius)',
      type: 'number',
    });
    expect(radius.newLine).toBe(true);
    const short = styleFieldMeta({ name: 'textColor', label: 'Text color', type: 'string', inspector: 'color' });
    expect(short.newLine).toBeUndefined();
  });
});
