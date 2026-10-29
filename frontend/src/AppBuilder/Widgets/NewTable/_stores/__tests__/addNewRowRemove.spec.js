import useTableStore from '../tableStore';

const TABLE_ID = 'addrowform-remove-table';
const table = () => useTableStore.getState();
const rows = () => [...table().getAllAddNewRowDetails(TABLE_ID).entries()];

function seedRows(names) {
  table().initializeComponent(TABLE_ID);
  names.forEach((name, index) => table().updateAddNewRowDetails(TABLE_ID, index, { name }));
}

describe('Table-ADDROWFORM-040 removing a new row from the store', () => {
  test('Table-ADDROWFORM-040 the rows after the removed one move up, so the indexes stay 0..n-1 in order', () => {
    // Break this catches: a gap in the indexes, or rows sent to the app in the wrong order.
    seedRows(['A', 'B', 'C', 'D']);

    table().removeAddNewRowDetail(TABLE_ID, 1);

    expect(rows()).toEqual([
      [0, { name: 'A' }],
      [1, { name: 'C' }],
      [2, { name: 'D' }],
    ]);
  });

  test('Table-ADDROWFORM-040 removing the last one drops only it', () => {
    // Break this catches: the wrong row being dropped at the end of the list.
    seedRows(['A', 'B', 'C']);

    table().removeAddNewRowDetail(TABLE_ID, 2);

    expect(rows()).toEqual([
      [0, { name: 'A' }],
      [1, { name: 'B' }],
    ]);
  });

  test('Table-ADDROWFORM-040 the store is never seen empty part-way, so no blank row gets added in between', () => {
    // Break this catches: a clear-then-refill removal that makes the form think nothing is left and add a blank row.
    seedRows(['A', 'B', 'C']);
    const sizes = [];
    const unsubscribe = useTableStore.subscribe((state) => sizes.push(state.components[TABLE_ID].addNewRow.size));

    table().removeAddNewRowDetail(TABLE_ID, 0);
    unsubscribe();

    expect(sizes.every((size) => size > 0)).toBe(true);
    expect(sizes).toEqual([2]);
  });

  test('Table-ADDROWFORM-040 an index that does not exist changes nothing', () => {
    // Break this catches: a stray click removing a row it was not pointing at.
    seedRows(['A', 'B']);

    table().removeAddNewRowDetail(TABLE_ID, 5);

    expect(rows()).toEqual([
      [0, { name: 'A' }],
      [1, { name: 'B' }],
    ]);
  });
});
