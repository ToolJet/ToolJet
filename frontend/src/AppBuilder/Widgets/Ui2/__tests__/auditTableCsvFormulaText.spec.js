import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture currentTableExportAcceptance016, the UI 2.0 Table part): the CSV export prefixed a
// text cell starting like a formula (=, +, -, @, tab, carriage return) with an apostrophe so spreadsheets read it as
// text, but not one starting with a line feed or with the full-width forms of those signs, which some spreadsheets
// also read as a formula. They are prefixed too; numbers stay numbers.
import Papa from 'papaparse';
import { normalizeColumns, toCsv } from '@/AppBuilder/Widgets/Ui2/Table/tableModel';

const exported = (value) => {
  const rows = [{ value }];
  const csv = toCsv(rows, normalizeColumns([{ key: 'value', name: 'Value' }], rows));
  const parsed = Papa.parse(csv, { delimiter: ',', skipEmptyLines: false });
  expect(parsed.errors).toEqual([]);
  expect(parsed.data).toHaveLength(2);
  return parsed.data[1][0];
};

test.each([
  ['equals', '=1+1'],
  ['plus', '+1+1'],
  ['minus', '-1+1'],
  ['at', '@SUM(1)'],
  ['tab', '\t=1+1'],
  ['carriage return', '\r=1+1'],
  ['line feed', '\n=1+1'],
  ['full-width equals', '＝1+1'],
  ['full-width plus', '＋1+1'],
  ['full-width minus', '－1+1'],
  ['full-width at', '＠SUM(1)'],
])('a text cell starting with %s is exported as text', (_, value) => {
  expect(exported(value)).toBe(`'${value}`);
});

test.each([
  ['quoted, multiline text', 'A "quote",\nnext line'],
  ['a negative number', -3],
])('%s is exported as it is (control)', (_, value) => {
  expect(exported(value)).toBe(String(value));
});

test('a header starting like a formula is exported as text too', () => {
  const rows = [{ value: 1 }];
  const csv = toCsv(rows, normalizeColumns([{ key: 'value', name: '＝Header' }], rows));
  expect(Papa.parse(csv, { delimiter: ',' }).data[0][0]).toBe("'＝Header");
});
