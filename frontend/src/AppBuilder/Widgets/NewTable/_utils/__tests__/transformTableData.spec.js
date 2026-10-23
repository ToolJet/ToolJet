import { transformTableData } from '../transformTableData';

const resolve = (code, { cellValue }) => (code === 'upper' ? String(cellValue).toUpperCase() : undefined);

describe('transformTableData', () => {
  test('returns the data itself when no column transforms it, so the table keeps its rows', () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(transformTableData(data, [], resolve)).toBe(data);
    expect(transformTableData(data, undefined, resolve)).toBe(data);
  });

  test('drops empty rows', () => {
    expect(transformTableData([{ id: 1 }, null, undefined, { id: 2 }], [], resolve)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('applies column transformations without touching the source rows', () => {
    const data = Object.freeze([Object.freeze({ id: 1, name: 'ann', meta: Object.freeze({ city: 'ktm' }) })]);
    const result = transformTableData(
      data,
      [
        { key: 'name', transformation: 'upper' },
        { key: 'meta.city', transformation: 'upper' },
      ],
      resolve
    );
    expect(result).toEqual([{ id: 1, name: 'ANN', meta: { city: 'KTM' } }]);
    expect(data[0].name).toBe('ann');
  });

  test('anything but an array is no rows', () => {
    expect(transformTableData({ id: 1 }, [], resolve)).toEqual([]);
  });
});
