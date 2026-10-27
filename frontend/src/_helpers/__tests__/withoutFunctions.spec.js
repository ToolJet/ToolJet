import { cloneDeep } from 'lodash';
import { removeFunctionObjects, withoutFunctions } from '../appUtils';

describe('withoutFunctions', () => {
  const rows = [{ id: 1 }, { id: 2 }];
  const value = {
    text1: { value: 'a', setText: () => {} },
    table1: { data: rows, selectRow: () => {}, nested: { list: [1, { run: () => {} }] } },
  };

  test('leaves what removeFunctionObjects leaves of a deep copy', () => {
    expect(withoutFunctions(value)).toEqual(removeFunctionObjects(cloneDeep(value)));
  });

  test('copies only what holds a function; the rest is shared, the input unchanged', () => {
    const result = withoutFunctions(value);
    expect(result.table1.data).toBe(rows);
    expect(typeof value.text1.setText).toBe('function');
    const plain = { a: [1, 2], b: { c: 3 } };
    expect(withoutFunctions(plain)).toBe(plain);
  });
});
