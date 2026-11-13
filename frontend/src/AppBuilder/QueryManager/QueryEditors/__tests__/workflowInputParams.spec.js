import {
  formatInputDefault,
  getDeclaredInputs,
  getInputParamValue,
  isConflictingParamsRow,
  isParamsRow,
  orderInputRowsLast,
  upsertInputParam,
} from '../workflowInputParams';

// Request body as the trigger builds it: later rows win.
const sent = (params) =>
  Object.fromEntries(
    orderInputRowsLast(params)
      .filter((p) => p.key !== '')
      .map((p) => [p.key, p.value])
  );

describe('workflowInputParams', () => {
  describe('getDeclaredInputs', () => {
    it.each([
      ['no version selected or a legacy version without an input contract', undefined, []],
      ['a version with no declared inputs', [], []],
    ])('returns no inputs for %s', (_label, inputs, expected) => {
      expect(getDeclaredInputs(inputs)).toEqual(expected);
    });

    it('returns the inputs declared by the selected version, skipping keyless entries', () => {
      const x = { key: 'x', type: 'string', required: true };
      const y = { key: 'y', type: 'number', required: false };
      expect(getDeclaredInputs([x, { key: '', type: 'string' }, y])).toEqual([x, y]);
    });
  });

  describe('isParamsRow', () => {
    const declared = new Set(['x']);

    it.each([
      ['a plain params row', { key: 'z', value: '1' }, true],
      ['a params row sharing a declared input key', { key: 'x', value: '1' }, true],
      ['an input row for a declared input', { key: 'x', value: '1', source: 'input' }, false],
      ['an input row the selected version no longer declares', { key: 'y', value: '1', source: 'input' }, true],
    ])('treats %s as %p', (_label, param, expected) => {
      expect(isParamsRow(param, declared)).toBe(expected);
    });
  });

  describe('getInputParamValue', () => {
    it('reads the input row, ignoring a params row with the same key', () => {
      const params = [
        { key: 'x', value: '{{20}}' },
        { key: 'x', value: '{{2}}', source: 'input' },
      ];
      expect(getInputParamValue(params, 'x')).toBe('{{2}}');
    });

    it('returns an empty string when the input has no row', () => {
      expect(getInputParamValue([{ key: 'x', value: '{{20}}' }], 'x')).toBe('');
    });
  });

  describe('isConflictingParamsRow', () => {
    const declared = new Set(['x']);
    const paramsX = { key: 'x', value: '{{20}}' };
    const inputX = { key: 'x', value: '{{2}}', source: 'input' };

    it('flags a params row whose key is an input that already has a value', () => {
      expect(isConflictingParamsRow(paramsX, [paramsX, inputX], declared)).toBe(true);
    });

    it('flags it even when the params value is empty', () => {
      const emptyX = { key: 'x', value: '' };
      expect(isConflictingParamsRow(emptyX, [emptyX, inputX], declared)).toBe(true);
    });

    it.each([
      ['the input has no value (legacy params row)', paramsX, [paramsX]],
      ['the key is not a declared input', { key: 'z', value: '1' }, [{ key: 'z', value: '1' }, inputX]],
      ['the row is the input row itself', inputX, [inputX]],
    ])('does not flag when %s', (_label, param, params) => {
      expect(isConflictingParamsRow(param, params, declared)).toBe(false);
    });
  });

  describe('upsertInputParam', () => {
    const params = [
      { key: 'extra', value: 'b', id: '2' },
      { key: 'x', value: 'a', id: '1', source: 'input' },
    ];

    it('updates the existing input row in place, keeping its id', () => {
      expect(upsertInputParam(params, 'x', 'c')).toEqual([
        { key: 'extra', value: 'b', id: '2' },
        { key: 'x', value: 'c', id: '1', source: 'input' },
      ]);
    });

    it('appends a new input row', () => {
      expect(upsertInputParam(params, 'y', '{{2}}')).toEqual([
        ...params,
        { key: 'y', value: '{{2}}', id: expect.any(String), source: 'input' },
      ]);
    });

    it('removes only the input row when the value is cleared so the input default applies', () => {
      const withParamsX = [{ key: 'x', value: 'p', id: '3' }, ...params];
      expect(upsertInputParam(withParamsX, 'x', '')).toEqual([{ key: 'x', value: 'p', id: '3' }, params[0]]);
    });

    it.each([
      ['clearing an input that has no row', 'y', ''],
      ['setting an input to its current value', 'x', 'a'],
    ])('returns the same array when %s', (_label, key, value) => {
      expect(upsertInputParam(params, key, value)).toBe(params);
    });
  });

  describe('orderInputRowsLast', () => {
    it('moves input rows after every params row, keeping relative order', () => {
      const params = [
        { key: 'x', value: '1', source: 'input' },
        { key: 'a', value: '2' },
        { key: 'y', value: '3', source: 'input' },
        { key: 'b', value: '4' },
      ];
      expect(orderInputRowsLast(params).map((p) => p.key)).toEqual(['a', 'b', 'x', 'y']);
    });

    it.each([
      ['already ordered', [{ key: 'a' }, { key: 'x', source: 'input' }]],
      ['without input rows', [{ key: 'a' }, { key: 'b' }]],
      ['empty', []],
    ])('returns the same array when %s', (_label, params) => {
      expect(orderInputRowsLast(params)).toBe(params);
    });
  });

  describe('a params row sharing an input key', () => {
    it('is overridden by the input, whichever was set first', () => {
      const inputFirst = [...upsertInputParam([], 'x', '{{2}}'), { key: 'x', value: '{{20}}', id: 'p' }];
      const paramsFirst = upsertInputParam([{ key: 'x', value: '{{20}}', id: 'p' }], 'x', '{{2}}');
      expect(sent(inputFirst)).toEqual({ x: '{{2}}' });
      expect(sent(paramsFirst)).toEqual({ x: '{{2}}' });
    });

    it('cannot override the input with an empty value', () => {
      expect(sent([...upsertInputParam([], 'x', '{{2}}'), { key: 'x', value: '', id: 'p' }])).toEqual({ x: '{{2}}' });
    });

    it('is sent as before when the input has no value', () => {
      expect(sent([{ key: 'x', value: '{{20}}', id: 'p' }])).toEqual({ x: '{{20}}' });
    });
  });

  describe('formatInputDefault', () => {
    it.each([
      ['hello', 'hello'],
      [5, '5'],
      [false, 'false'],
      [null, 'null'],
      [{ a: 1 }, '{"a":1}'],
      [[1, 2], '[1,2]'],
    ])('formats %p as %p', (value, expected) => {
      expect(formatInputDefault(value)).toBe(expected);
    });
  });
});
