/**
 * The UI 2.0 options list editor reads a field's code ({{['A', 'B']}}, {{[{ label, value }]}}) into a list and writes
 * the list back into the same value. These pin the conversions: literals round-trip, bindings stay in code, values
 * keep their type (0 and false survive), and both spellings of disabled (`disabled`, the native `disable`) are read.
 */
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import {
  BLOCKED,
  coerceValue,
  convertValue,
  entryLabel,
  entryValue,
  entryValueType,
  formatLiteral,
  isDisabledEntry,
  moveEntry,
  newEntry,
  optionsListBlockReason,
  parseLiteral,
  readDefaultValues,
  readOptionsCode,
  withDisabled,
  withLabel,
  withValue,
  writeDefault,
  writeOptionsCode,
} from '../optionsLiteral';
import { isDisabledOption } from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';

const roundTrip = (code) => writeOptionsCode(readOptionsCode(code).entries);

describe('parseLiteral', () => {
  test('reads JavaScript literals', () => {
    expect(parseLiteral(`[1, -2.5, .5, 1e3, 0x1f, +3, 'a', "b", \`c\`, true, false, null, undefined]`)).toEqual([
      1,
      -2.5,
      0.5,
      1000,
      31,
      3,
      'a',
      'b',
      'c',
      true,
      false,
      null,
      undefined,
    ]);
    expect(parseLiteral(`{ label: 'A', 'my key': 1, "q": [ { x: {} } ], 2: 'two', $id: 'x', }`)).toEqual({
      label: 'A',
      'my key': 1,
      q: [{ x: {} }],
      2: 'two',
      $id: 'x',
    });
    expect(parseLiteral(`[\n  // a comment\n  'a', /* another */ 'b',\n]`)).toEqual(['a', 'b']);
    expect(parseLiteral(`['it\\'s', "say \\"hi\\"", 'tab\\there', '\\x41\\u0042\\u{43}', 'line\\nbreak']`)).toEqual([
      "it's",
      'say "hi"',
      'tab\there',
      'ABC',
      'line\nbreak',
    ]);
  });

  test.each([
    ['queries.list.data'],
    ['[a]'],
    ["['a'].map((x) => x)"],
    ["[...items, 'a']"],
    ['[1, , 2]'],
    ['`${name}`'],
    ['{ a }'],
    ['{ [key]: 1 }'],
    ['{ __proto__: {} }'],
    ["['a' + 'b']"],
    ['[1] [2]'],
    ["'unclosed"],
    ['NaN'],
  ])('refuses %s', (text) => {
    expect(() => parseLiteral(text)).toThrow();
  });
});

describe('formatLiteral', () => {
  test('writes in the configs style', () => {
    expect(formatLiteral(['All', 'Open'])).toBe("['All', 'Open']");
    expect(formatLiteral([{ label: 'One', value: 1 }])).toBe("[{ label: 'One', value: 1 }]");
    expect(formatLiteral({ 'my key': [true, null, -0], a: {} })).toBe("{ 'my key': [true, null, -0], a: {} }");
  });

  test('escapes quotes, line breaks and the braces that would end the binding', () => {
    const text = "it's {{ x }} a\\b\nc }}}";
    const written = formatLiteral(text);
    expect(written).not.toMatch(/\{\{|\}\}/);
    expect(written).not.toContain('\n');
    expect(parseLiteral(written)).toBe(text);
    const code = writeOptionsCode([{ label: text, value: '}}' }]);
    expect(code.slice(2, -2)).not.toMatch(/\{\{|\}\}/);
    expect(readOptionsCode(code).entries).toEqual([{ label: text, value: '}}' }]);
  });
});

describe('code to list to code', () => {
  const OPTION_FIELDS = shadcnConfigs.flatMap((config) =>
    Object.entries(config.properties)
      .filter(([, meta]) => meta.type === 'optionsList')
      .map(([key]) => [config.name, key, config.definition.properties[key].value])
  );

  test('every opted-in field has a list editor', () => {
    expect(OPTION_FIELDS.map(([name, key]) => `${name}.${key}`).sort()).toEqual([
      'ShadButtonGroup.buttons',
      'ShadCombobox.options',
      'ShadMultiselect.options',
      'ShadRadioGroup.options',
      'ShadSelect.options',
      'ShadToggleGroup.options',
    ]);
  });

  test.each(OPTION_FIELDS)("%s's default %s reads as a list and writes back unchanged", (name, key, code) => {
    expect(optionsListBlockReason(code)).toBeNull();
    expect(roundTrip(code)).toBe(code);
  });

  test.each([
    "{{['a', 'b']}}",
    "{{[{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }]}}",
    "{{[{ label: 'Zero', value: 0 }, { label: 'No', value: false }, 'plain', 7, true]}}",
    "{{[{ label: 'US', value: 'us', group: 'Americas', description: 'United States', icon: 'IconFlag' }]}}",
    '{{[]}}',
  ])('%s is written back exactly', (code) => {
    expect(roundTrip(code)).toBe(code);
  });

  test.each([
    `{{ [ {label:"A",value:"a"} ,\n {"label":'B', value: 2,}, ] }}`,
    "  {{[ 'x', 'y' ]}}  ",
    `{{[{ label: 'Live', value: 'live', disable: true }, { value: 'v' }, { label: 'L' }]}}`,
  ])('%s, written another way, keeps every option as it was', (code) => {
    const { entries } = readOptionsCode(code);
    expect(readOptionsCode(writeOptionsCode(entries)).entries).toEqual(entries);
  });

  test('an empty field, or none, is an empty list', () => {
    expect(readOptionsCode('').entries).toEqual([]);
    expect(readOptionsCode(undefined).entries).toEqual([]);
    expect(readOptionsCode(['a', { label: 'B', value: 'b' }]).entries).toEqual(['a', { label: 'B', value: 'b' }]);
  });

  test.each([
    ['{{queries.getStatuses.data}}', BLOCKED.bound],
    ['{{components.table1.data.map((r) => r.status)}}', BLOCKED.bound],
    ["{{['a'].concat(variables.more)}}", BLOCKED.bound],
    ["{{[{ label: 'A', value: globals.currentUser.id }]}}", BLOCKED.bound],
    ["{{['a']}} {{['b']}}", BLOCKED.bound],
    ['a, b, c', BLOCKED.notList],
    ["{{{ label: 'A' }}}", BLOCKED.notList],
    ["{{['a', ['b']]}}", BLOCKED.entry(2)],
    ["{{[{ label: 'A', value: { id: 1 } }]}}", BLOCKED.entry(1)],
    ['{{[null]}}', BLOCKED.entry(1)],
    ['{{[{}]}}', BLOCKED.entry(1)],
    [42, BLOCKED.notList],
  ])('%s stays in code', (code, reason) => {
    expect(optionsListBlockReason(code)).toBe(reason);
  });
});

describe('editing one entry', () => {
  test('a plain text option stays plain while its label is edited, and takes { label, value } for its own value', () => {
    expect(withLabel('Open', 'Pending')).toBe('Pending');
    expect(withValue('Open', 'Open')).toBe('Open');
    expect(withValue('Open', 'open')).toEqual({ label: 'Open', value: 'open' });
    expect(withValue('Open', 0)).toEqual({ label: 'Open', value: 0 });
  });

  test('a value that reads as its label follows it; a value of its own does not', () => {
    expect(withLabel({ label: 'A', value: 'A' }, 'B')).toEqual({ label: 'B', value: 'B' });
    expect(withLabel({ label: 'A', value: 'a' }, 'B')).toEqual({ label: 'B', value: 'a' });
    expect(withLabel({ value: 'a' }, 'b')).toEqual({ value: 'b' });
    expect(withLabel({ label: 'One', value: 1 }, 'Uno')).toEqual({ label: 'Uno', value: 1 });
  });

  test('values keep their type: 0 and false survive edits to the label', () => {
    expect(withLabel(0, 'Zero')).toEqual({ label: 'Zero', value: 0 });
    expect(withLabel(false, 'No')).toEqual({ label: 'No', value: false });
    expect(withLabel(0, '0')).toBe(0);
    expect(withValue(1, 2)).toBe(2);
    const code = writeOptionsCode([withLabel(0, 'Zero'), withLabel(false, 'No'), { label: 'Off', value: false }]);
    expect(code).toBe(
      "{{[{ label: 'Zero', value: 0 }, { label: 'No', value: false }, { label: 'Off', value: false }]}}"
    );
    expect(readOptionsCode(code).entries.map(entryValue)).toEqual([0, false, false]);
    expect(entryValueType({ label: 'Zero', value: 0 })).toBe('number');
    expect(entryValueType({ label: 'No', value: false })).toBe('boolean');
    expect(entryValueType('a')).toBe('string');
  });

  test('a value is typed as its type: a number from its digits, true/false, text as typed', () => {
    expect(coerceValue('42', 'number')).toBe(42);
    expect(coerceValue('-0.5', 'number')).toBe(-0.5);
    expect(coerceValue('0', 'number')).toBe(0);
    expect(coerceValue('', 'number')).toBeUndefined();
    expect(coerceValue('4x', 'number')).toBeUndefined();
    expect(coerceValue('false', 'boolean')).toBe(false);
    expect(coerceValue('007', 'string')).toBe('007');
    expect(convertValue('12', 'number')).toBe(12);
    expect(convertValue('abc', 'number')).toBe(0);
    expect(convertValue(0, 'string')).toBe('0');
    expect(convertValue(false, 'number')).toBe(0);
    expect(convertValue('true', 'boolean')).toBe(true);
  });

  test('disabled reads both spellings, as the widgets do, and keeps the one the option uses', () => {
    for (const e of [
      { label: 'A', disabled: true },
      { label: 'A', disable: true },
      { label: 'A', disabled: 'yes' },
    ]) {
      expect(isDisabledEntry(e)).toBe(isDisabledOption(e));
    }
    expect(withDisabled('A', true)).toEqual({ label: 'A', value: 'A', disabled: true });
    expect(withDisabled({ label: 'A', value: 'a', disable: false }, true)).toEqual({
      label: 'A',
      value: 'a',
      disable: true,
    });
    expect(withDisabled({ label: 'A', value: 'a', disable: true }, false)).toEqual({ label: 'A', value: 'a' });
    expect(withDisabled({ label: 'A', value: 'a', disabled: false }, false)).toEqual({
      label: 'A',
      value: 'a',
      disabled: false,
    });
    expect(withDisabled('A', false)).toBe('A');
  });

  test('labels and values as the widgets read them', () => {
    expect(entryLabel({ value: 3 })).toBe('3');
    expect(entryValue({ label: 'L' })).toBe('L');
    expect(entryLabel({ label: 'A', value: 'a' })).toBe('A');
    expect(entryLabel(true)).toBe('true');
  });

  test('a new option follows the list: plain text, the next number, or { label, value }', () => {
    expect(newEntry([])).toBe('Option 1');
    expect(newEntry(['All', 'Open'])).toBe('Option 3');
    expect(newEntry(['Option 3', 'x'])).toBe('Option 4');
    expect(
      newEntry([
        { label: 'One', value: 1 },
        { label: 'Five', value: 5 },
      ])
    ).toEqual({ label: 'Option 3', value: 6 });
    expect(newEntry([{ label: 'A', value: 'a' }])).toEqual({ label: 'Option 2', value: 'Option 2' });
  });

  test('moveEntry moves one entry', () => {
    expect(moveEntry(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveEntry(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
});

describe('default selection', () => {
  test('reads plain text, literals and lists, keeping types; a binding is code', () => {
    expect(readDefaultValues('Standard')).toEqual({ bound: false, values: ['Standard'] });
    expect(readDefaultValues('')).toEqual({ bound: false, values: [] });
    expect(readDefaultValues('{{1}}')).toEqual({ bound: false, values: [1] });
    expect(readDefaultValues('{{false}}')).toEqual({ bound: false, values: [false] });
    expect(readDefaultValues("{{['design', 2]}}")).toEqual({ bound: false, values: ['design', 2] });
    expect(readDefaultValues('{{components.select1.value}}')).toEqual({ bound: true, values: [] });
  });

  test('writes text plainly and anything else as a literal', () => {
    expect(writeDefault(['Standard'], false)).toBe('Standard');
    expect(writeDefault([1], false)).toBe('{{1}}');
    expect(writeDefault([false], false)).toBe('{{false}}');
    expect(writeDefault([' padded '], false)).toBe("{{' padded '}}");
    expect(writeDefault([], false)).toBe('');
    expect(writeDefault(['design', 2], true)).toBe("{{['design', 2]}}");
    expect(writeDefault([], true)).toBe('{{[]}}');
  });
});
